import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { dropDatabase } from './utils';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { PurchasedItem } from '../src/modules/purchased-item/schemas/purchase-item.schema';
import { User } from '../src/modules/user/schemas/user.schema';
import { Performer } from '../src/modules/performer/schemas/performer.schema';
import { Earning } from '../src/modules/earning/schemas/earning.schema';
import {
  PURCHASE_ITEM_TYPE,
  PURCHASE_ITEM_STATUS,
  SETTLEMENT_STATUS
} from '../src/modules/purchased-item/constants';
import { ROLE } from '../src/kernel/constants';
import { QueueEventService, QueueEvent } from '../src/kernel';
import { PURCHASED_ITEM_SUCCESS_CHANNEL } from '../src/modules/purchased-item/constants';
import { EVENT } from '../src/kernel/constants';

require('dotenv').config();

describe('PurchasedItem Settlement Non-Negative Balance (e2e)', () => {
  let app: INestApplication;
  let purchasedItemModel: Model<PurchasedItem>;
  let userModel: Model<User>;
  let performerModel: Model<Performer>;
  let earningModel: Model<Earning>;
  let queueEventService: QueueEventService;

  let userId: Types.ObjectId;
  let performerId: Types.ObjectId;

  beforeAll(async () => {
    await dropDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    purchasedItemModel = moduleFixture.get<Model<PurchasedItem>>(
      getModelToken(PurchasedItem.name)
    );
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    performerModel = moduleFixture.get<Model<Performer>>(
      getModelToken(Performer.name)
    );
    earningModel = moduleFixture.get<Model<Earning>>(
      getModelToken(Earning.name)
    );
    queueEventService = moduleFixture.get<QueueEventService>(QueueEventService);

    // Create test user with specific balance
    const user = await userModel.create({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      balance: 200, // Initial balance
      role: ROLE.USER,
      stats: {
        totalTokenSpent: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    userId = user._id as Types.ObjectId;

    // Create test performer
    const performer = await performerModel.create({
      username: 'testperformer',
      email: 'testperformer@test.com',
      password: 'hashed_password',
      firstName: 'Test',
      lastName: 'Performer',
      balance: 0,
      role: ROLE.PERFORMER,
      stats: {
        totalTokenEarned: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    performerId = performer._id as Types.ObjectId;
  });

  afterAll(async () => {
    await dropDatabase();
    await app.close();
  });

  describe('Non-negative balance enforcement', () => {
    it('should settle successfully when user has exact balance', async (done) => {
      // Set user balance to exact amount needed
      await userModel.updateOne({ _id: userId }, { $set: { balance: 100 } });

      // Create a PurchasedItem that costs exactly 100 tokens
      const purchasedItem = await purchasedItemModel.create({
        source: ROLE.USER,
        sourceId: userId,
        target: 'tip',
        targetId: performerId,
        sellerId: performerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        name: 'Test Item',
        description: 'Test description',
        price: 100,
        quantity: 1,
        totalPrice: 100,
        originalPrice: 100,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        settlementStatus: SETTLEMENT_STATUS.PENDING,
        extraInfo: {
          tipMenuItemId: new Types.ObjectId()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const itemId = purchasedItem._id as Types.ObjectId;

      // Publish the settlement event
      await queueEventService.publish(
        new QueueEvent({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: purchasedItem.toObject()
        })
      );

      // Wait for settlement to complete
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify settlement succeeded
      const settledItem = await purchasedItemModel.findById(itemId);
      expect(settledItem.settlementStatus).toBe(SETTLEMENT_STATUS.SETTLED);

      // Verify user balance is now 0 (not negative)
      const user = await userModel.findById(userId);
      expect(user.balance).toBe(0);
      expect(user.balance).toBeGreaterThanOrEqual(0);

      // Verify Earning was created
      const earnings = await earningModel.find({
        transactionTokenId: itemId
      });
      expect(earnings).toHaveLength(1);

      done();
    }, 10000);

    it('should fail settlement when user has insufficient balance', async (done) => {
      // Set user balance to less than needed
      await userModel.updateOne({ _id: userId }, { $set: { balance: 50 } });

      // Create a PurchasedItem that costs 100 tokens (more than balance)
      const purchasedItem = await purchasedItemModel.create({
        source: ROLE.USER,
        sourceId: userId,
        target: 'tip',
        targetId: performerId,
        sellerId: performerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        name: 'Test Item 2',
        description: 'Test description',
        price: 100,
        quantity: 1,
        totalPrice: 100,
        originalPrice: 100,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        settlementStatus: SETTLEMENT_STATUS.PENDING,
        extraInfo: {
          tipMenuItemId: new Types.ObjectId()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const itemId = purchasedItem._id as Types.ObjectId;

      // Record initial performer balance
      const initialPerformer = await performerModel.findById(performerId);
      const initialPerformerBalance = initialPerformer.balance;

      // Publish the settlement event
      await queueEventService.publish(
        new QueueEvent({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: purchasedItem.toObject()
        })
      );

      // Wait for settlement to attempt
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify settlement failed
      const failedItem = await purchasedItemModel.findById(itemId);
      expect(failedItem.settlementStatus).toBe(SETTLEMENT_STATUS.FAILED);

      // Verify user balance is unchanged and non-negative
      const user = await userModel.findById(userId);
      expect(user.balance).toBe(50);
      expect(user.balance).toBeGreaterThanOrEqual(0);

      // Verify performer balance is unchanged
      const performer = await performerModel.findById(performerId);
      expect(performer.balance).toBe(initialPerformerBalance);

      // Verify no Earning was created
      const earnings = await earningModel.find({
        transactionTokenId: itemId
      });
      expect(earnings).toHaveLength(0);

      done();
    }, 10000);

    it('should prevent negative balance under concurrent processing', async (done) => {
      // Set user balance
      await userModel.updateOne({ _id: userId }, { $set: { balance: 150 } });

      // Create two PurchasedItems that together exceed balance
      const purchasedItem1 = await purchasedItemModel.create({
        source: ROLE.USER,
        sourceId: userId,
        target: 'tip',
        targetId: performerId,
        sellerId: performerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        name: 'Concurrent Item 1',
        description: 'Test description',
        price: 100,
        quantity: 1,
        totalPrice: 100,
        originalPrice: 100,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        settlementStatus: SETTLEMENT_STATUS.PENDING,
        extraInfo: {
          tipMenuItemId: new Types.ObjectId()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const purchasedItem2 = await purchasedItemModel.create({
        source: ROLE.USER,
        sourceId: userId,
        target: 'tip',
        targetId: performerId,
        sellerId: performerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        name: 'Concurrent Item 2',
        description: 'Test description',
        price: 100,
        quantity: 1,
        totalPrice: 100,
        originalPrice: 100,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        settlementStatus: SETTLEMENT_STATUS.PENDING,
        extraInfo: {
          tipMenuItemId: new Types.ObjectId()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const itemId1 = purchasedItem1._id as Types.ObjectId;
      const itemId2 = purchasedItem2._id as Types.ObjectId;

      // Publish both settlement events simultaneously
      await Promise.all([
        queueEventService.publish(
          new QueueEvent({
            channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
            eventName: EVENT.CREATED,
            data: purchasedItem1.toObject()
          })
        ),
        queueEventService.publish(
          new QueueEvent({
            channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
            eventName: EVENT.CREATED,
            data: purchasedItem2.toObject()
          })
        )
      ]);

      // Wait for both settlements to attempt
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Retrieve both items
      const item1 = await purchasedItemModel.findById(itemId1);
      const item2 = await purchasedItemModel.findById(itemId2);

      // One should settle, one should fail
      const settledItems = [item1, item2].filter(
        (item) => item.settlementStatus === SETTLEMENT_STATUS.SETTLED
      );
      const failedItems = [item1, item2].filter(
        (item) => item.settlementStatus === SETTLEMENT_STATUS.FAILED
      );

      expect(settledItems).toHaveLength(1);
      expect(failedItems).toHaveLength(1);

      // Verify user balance is non-negative
      const user = await userModel.findById(userId);
      expect(user.balance).toBeGreaterThanOrEqual(0);

      // Balance should be 50 (150 - 100 for one successful settlement)
      expect(user.balance).toBe(50);

      // Verify only one Earning was created
      const earnings = await earningModel.find({
        transactionTokenId: { $in: [itemId1, itemId2] }
      });
      expect(earnings).toHaveLength(1);

      // Verify the Earning corresponds to the settled item
      const settledItemId = settledItems[0]._id;
      expect(earnings[0].transactionTokenId.toString()).toBe(
        settledItemId.toString()
      );

      done();
    }, 12000);

    it('should enforce non-negative balance at database level', async (done) => {
      // Set user balance to 0
      await userModel.updateOne({ _id: userId }, { $set: { balance: 0 } });

      // Attempt to create a PurchasedItem
      const purchasedItem = await purchasedItemModel.create({
        source: ROLE.USER,
        sourceId: userId,
        target: 'tip',
        targetId: performerId,
        sellerId: performerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        name: 'Zero Balance Test',
        description: 'Test description',
        price: 50,
        quantity: 1,
        totalPrice: 50,
        originalPrice: 50,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        settlementStatus: SETTLEMENT_STATUS.PENDING,
        extraInfo: {
          tipMenuItemId: new Types.ObjectId()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const itemId = purchasedItem._id as Types.ObjectId;

      // Publish the settlement event
      await queueEventService.publish(
        new QueueEvent({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: purchasedItem.toObject()
        })
      );

      // Wait for settlement to attempt
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify settlement failed
      const failedItem = await purchasedItemModel.findById(itemId);
      expect(failedItem.settlementStatus).toBe(SETTLEMENT_STATUS.FAILED);

      // Verify balance is still 0 (not negative)
      const user = await userModel.findById(userId);
      expect(user.balance).toBe(0);
      expect(user.balance).toBeGreaterThanOrEqual(0);

      // Verify no Earning created
      const earnings = await earningModel.find({
        transactionTokenId: itemId
      });
      expect(earnings).toHaveLength(0);

      done();
    }, 10000);

    it('should maintain data consistency when settlement fails', async (done) => {
      // Set user balance
      await userModel.updateOne({ _id: userId }, { $set: { balance: 25 } });

      // Record initial state
      const initialUser = await userModel.findById(userId);
      const initialPerformer = await performerModel.findById(performerId);
      const initialUserBalance = initialUser.balance;
      const initialPerformerBalance = initialPerformer.balance;
      const initialUserTokensSpent = initialUser.stats.totalTokenSpent;

      // Create a PurchasedItem that exceeds balance
      const purchasedItem = await purchasedItemModel.create({
        source: ROLE.USER,
        sourceId: userId,
        target: 'tip',
        targetId: performerId,
        sellerId: performerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        name: 'Consistency Test',
        description: 'Test description',
        price: 100,
        quantity: 1,
        totalPrice: 100,
        originalPrice: 100,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        settlementStatus: SETTLEMENT_STATUS.PENDING,
        extraInfo: {
          tipMenuItemId: new Types.ObjectId()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const itemId = purchasedItem._id as Types.ObjectId;

      // Publish the settlement event
      await queueEventService.publish(
        new QueueEvent({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: purchasedItem.toObject()
        })
      );

      // Wait for settlement to attempt
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify settlement failed
      const failedItem = await purchasedItemModel.findById(itemId);
      expect(failedItem.settlementStatus).toBe(SETTLEMENT_STATUS.FAILED);

      // Verify all state remains unchanged
      const finalUser = await userModel.findById(userId);
      const finalPerformer = await performerModel.findById(performerId);

      expect(finalUser.balance).toBe(initialUserBalance);
      expect(finalPerformer.balance).toBe(initialPerformerBalance);
      expect(finalUser.stats.totalTokenSpent).toBe(initialUserTokensSpent);

      // Verify no Earning was created
      const earnings = await earningModel.find({
        transactionTokenId: itemId
      });
      expect(earnings).toHaveLength(0);

      done();
    }, 10000);
  });
});
