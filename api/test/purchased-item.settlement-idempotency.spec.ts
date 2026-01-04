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

describe('PurchasedItem Settlement Idempotency (e2e)', () => {
  let app: INestApplication;
  let purchasedItemModel: Model<PurchasedItem>;
  let userModel: Model<User>;
  let performerModel: Model<Performer>;
  let earningModel: Model<Earning>;
  let queueEventService: QueueEventService;

  let userId: Types.ObjectId;
  let performerId: Types.ObjectId;
  let purchasedItemId: Types.ObjectId;

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

    // Create test user
    const user = await userModel.create({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      balance: 1000,
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

  describe('Settlement listener idempotency', () => {
    it('should not double debit/credit when same event is processed twice', async (done) => {
      // Create a PurchasedItem with status SUCCESS (ready for settlement)
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

      purchasedItemId = purchasedItem._id as Types.ObjectId;

      // Record initial balances
      const initialUser = await userModel.findById(userId);
      const initialPerformer = await performerModel.findById(performerId);
      const initialUserBalance = initialUser.balance;
      const initialPerformerBalance = initialPerformer.balance;

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

      // Verify settlement occurred
      const settledItem = await purchasedItemModel.findById(purchasedItemId);
      expect(settledItem.settlementStatus).toBe(SETTLEMENT_STATUS.SETTLED);

      // Check balances after first settlement
      const userAfterFirst = await userModel.findById(userId);
      const performerAfterFirst = await performerModel.findById(performerId);
      const userBalanceAfterFirst = userAfterFirst.balance;
      const performerBalanceAfterFirst = performerAfterFirst.balance;

      // User balance should have decreased
      expect(userBalanceAfterFirst).toBe(initialUserBalance - 100);

      // Performer balance should have increased (minus commission)
      expect(performerBalanceAfterFirst).toBeGreaterThan(
        initialPerformerBalance
      );

      // Check that one Earning was created
      const earningsAfterFirst = await earningModel.find({
        transactionTokenId: purchasedItemId
      });
      expect(earningsAfterFirst).toHaveLength(1);

      // Publish the same event again (simulating duplicate processing)
      await queueEventService.publish(
        new QueueEvent({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: settledItem.toObject()
        })
      );

      // Wait for potential duplicate processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify settlement status is still SETTLED
      const itemAfterDuplicate = await purchasedItemModel.findById(
        purchasedItemId
      );
      expect(itemAfterDuplicate.settlementStatus).toBe(
        SETTLEMENT_STATUS.SETTLED
      );

      // Check balances after duplicate event - should be unchanged
      const userAfterDuplicate = await userModel.findById(userId);
      const performerAfterDuplicate = await performerModel.findById(
        performerId
      );

      expect(userAfterDuplicate.balance).toBe(userBalanceAfterFirst);
      expect(performerAfterDuplicate.balance).toBe(performerBalanceAfterFirst);

      // Verify still only one Earning record exists
      const earningsAfterDuplicate = await earningModel.find({
        transactionTokenId: purchasedItemId
      });
      expect(earningsAfterDuplicate).toHaveLength(1);

      // Verify the Earning record is identical
      expect(earningsAfterDuplicate[0]._id.toString()).toBe(
        earningsAfterFirst[0]._id.toString()
      );

      done();
    }, 10000); // Increase timeout for async operations

    it('should skip settlement if status is not SUCCESS', async (done) => {
      // Create a PurchasedItem with PENDING status
      const purchasedItem = await purchasedItemModel.create({
        source: ROLE.USER,
        sourceId: userId,
        target: 'tip',
        targetId: performerId,
        sellerId: performerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        name: 'Test Item 2',
        description: 'Test description',
        price: 50,
        quantity: 1,
        totalPrice: 50,
        originalPrice: 50,
        status: PURCHASE_ITEM_STATUS.PENDING, // Not SUCCESS
        settlementStatus: SETTLEMENT_STATUS.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const itemId = purchasedItem._id as Types.ObjectId;

      // Record initial balances
      const initialUser = await userModel.findById(userId);
      const initialPerformer = await performerModel.findById(performerId);
      const initialUserBalance = initialUser.balance;
      const initialPerformerBalance = initialPerformer.balance;

      // Publish the settlement event
      await queueEventService.publish(
        new QueueEvent({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: purchasedItem.toObject()
        })
      );

      // Wait for potential processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify settlement did NOT occur
      const itemAfter = await purchasedItemModel.findById(itemId);
      expect(itemAfter.settlementStatus).toBe(SETTLEMENT_STATUS.PENDING);

      // Verify balances are unchanged
      const userAfter = await userModel.findById(userId);
      const performerAfter = await performerModel.findById(performerId);

      expect(userAfter.balance).toBe(initialUserBalance);
      expect(performerAfter.balance).toBe(initialPerformerBalance);

      // Verify no Earning created
      const earnings = await earningModel.find({
        transactionTokenId: itemId
      });
      expect(earnings).toHaveLength(0);

      done();
    }, 8000);

    it('should skip settlement if already in PROCESSING state', async (done) => {
      // Create a PurchasedItem with PROCESSING settlement status
      const purchasedItem = await purchasedItemModel.create({
        source: ROLE.USER,
        sourceId: userId,
        target: 'tip',
        targetId: performerId,
        sellerId: performerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        name: 'Test Item 3',
        description: 'Test description',
        price: 75,
        quantity: 1,
        totalPrice: 75,
        originalPrice: 75,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        settlementStatus: SETTLEMENT_STATUS.PROCESSING, // Already processing
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const itemId = purchasedItem._id as Types.ObjectId;

      // Record initial balances
      const initialUser = await userModel.findById(userId);
      const initialPerformer = await performerModel.findById(performerId);
      const initialUserBalance = initialUser.balance;
      const initialPerformerBalance = initialPerformer.balance;

      // Publish the settlement event
      await queueEventService.publish(
        new QueueEvent({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: purchasedItem.toObject()
        })
      );

      // Wait for potential processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify settlement status remains PROCESSING (not changed to SETTLED)
      const itemAfter = await purchasedItemModel.findById(itemId);
      expect(itemAfter.settlementStatus).toBe(SETTLEMENT_STATUS.PROCESSING);

      // Verify balances are unchanged
      const userAfter = await userModel.findById(userId);
      const performerAfter = await performerModel.findById(performerId);

      expect(userAfter.balance).toBe(initialUserBalance);
      expect(performerAfter.balance).toBe(initialPerformerBalance);

      // Verify no Earning created
      const earnings = await earningModel.find({
        transactionTokenId: itemId
      });
      expect(earnings).toHaveLength(0);

      done();
    }, 8000);
  });
});
