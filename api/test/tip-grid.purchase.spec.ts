import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { dropDatabase, getAuthToken } from './utils';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { PurchasedItem } from '../src/modules/purchased-item/schemas/purchase-item.schema';
import { User } from '../src/modules/user/schemas/user.schema';
import { Performer } from '../src/modules/performer/schemas/performer.schema';
import { TipMenu, TipMenuItem } from '../src/modules/tip-grid/schemas';
import { PURCHASE_ITEM_TYPE, PURCHASE_ITEM_STATUS } from '../src/modules/purchased-item/constants';
import { ROLE } from '../src/kernel/constants';

require('dotenv').config();

describe('TipGrid Purchase (e2e)', () => {
  let app: INestApplication;
  let purchasedItemModel: Model<PurchasedItem>;
  let userModel: Model<User>;
  let performerModel: Model<Performer>;
  let tipMenuModel: Model<TipMenu>;
  let tipMenuItemModel: Model<TipMenuItem>;
  
  let userToken: string;
  let performerToken: string;
  let userId: Types.ObjectId;
  let performerId: Types.ObjectId;
  let tipMenuItemId: Types.ObjectId;

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
    tipMenuModel = moduleFixture.get<Model<TipMenu>>(
      getModelToken(TipMenu.name)
    );
    tipMenuItemModel = moduleFixture.get<Model<TipMenuItem>>(
      getModelToken(TipMenuItem.name)
    );

    // Create and authenticate test user
    await request(app.getHttpServer())
      .post('/auth/users/register')
      .send({
        username: 'testuser',
        email: 'testuser@test.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User'
      });

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/users/login')
      .send({
        email: 'testuser@test.com',
        password: 'Test123!@#'
      });

    userToken = userLoginResponse.body.token;
    const user = await userModel.findOne({ email: 'testuser@test.com' });
    userId = user._id as Types.ObjectId;

    // Set user balance
    await userModel.updateOne(
      { _id: userId },
      { $set: { balance: 1000 } }
    );

    // Create and authenticate test performer
    await request(app.getHttpServer())
      .post('/auth/performers/register')
      .send({
        username: 'testperformer',
        email: 'testperformer@test.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'Performer'
      });

    const performerLoginResponse = await request(app.getHttpServer())
      .post('/auth/performers/login')
      .send({
        email: 'testperformer@test.com',
        password: 'Test123!@#'
      });

    performerToken = performerLoginResponse.body.token;
    const performer = await performerModel.findOne({
      email: 'testperformer@test.com'
    });
    performerId = performer._id as Types.ObjectId;

    // Create tip menu
    await tipMenuModel.create({
      performerId,
      title: 'Test Tip Menu',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create tip menu item
    const tipMenuItem = await tipMenuItemModel.create({
      performerId,
      label: 'Test Item',
      description: 'Test description',
      price: 100,
      position: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    tipMenuItemId = tipMenuItem._id as Types.ObjectId;
  });

  afterAll(async () => {
    await dropDatabase();
    await app.close();
  });

  describe('POST /tip-grid/purchase', () => {
    it('should create PurchasedItem with type tip_grid_item and status pending', async () => {
      const response = await request(app.getHttpServer())
        .post('/tip-grid/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipMenuItemId: tipMenuItemId.toString(),
          performerId: performerId.toString(),
          conversationId: null
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactionId');

      const transactionId = response.body.transactionId;

      // Verify PurchasedItem was created with correct fields
      const purchasedItem = await purchasedItemModel.findById(transactionId);

      expect(purchasedItem).toBeDefined();
      expect(purchasedItem.type).toBe(PURCHASE_ITEM_TYPE.TIP_GRID_ITEM);
      expect(purchasedItem.status).toBe(PURCHASE_ITEM_STATUS.PENDING);
      expect(purchasedItem.source).toBe(ROLE.USER);
      expect(purchasedItem.sourceId.toString()).toBe(userId.toString());
      expect(purchasedItem.sellerId.toString()).toBe(performerId.toString());
      expect(purchasedItem.totalPrice).toBe(100);
      expect(purchasedItem.price).toBe(100);
      expect(purchasedItem.quantity).toBe(1);
      expect(purchasedItem.extraInfo).toHaveProperty('tipMenuItemId');
      expect(purchasedItem.extraInfo.tipMenuItemId.toString()).toBe(
        tipMenuItemId.toString()
      );
    });

    it('should not create duplicate PurchasedItem with same idempotencyKey', async () => {
      const idempotencyKey = `test-idempotency-${Date.now()}-${Math.random()}`;

      // First request with idempotency key
      const firstResponse = await request(app.getHttpServer())
        .post('/tip-grid/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipMenuItemId: tipMenuItemId.toString(),
          performerId: performerId.toString(),
          conversationId: null,
          idempotencyKey
        })
        .expect(200);

      expect(firstResponse.body).toHaveProperty('success', true);
      expect(firstResponse.body).toHaveProperty('transactionId');

      const firstTransactionId = firstResponse.body.transactionId;

      // Verify first PurchasedItem was created
      const firstPurchasedItem = await purchasedItemModel.findById(
        firstTransactionId
      );
      expect(firstPurchasedItem).toBeDefined();
      expect(firstPurchasedItem.idempotencyKey).toBe(idempotencyKey);

      // Second request with same idempotency key should fail
      const secondResponse = await request(app.getHttpServer())
        .post('/tip-grid/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipMenuItemId: tipMenuItemId.toString(),
          performerId: performerId.toString(),
          conversationId: null,
          idempotencyKey
        })
        .expect(400);

      expect(secondResponse.body).toHaveProperty('message');
      expect(secondResponse.body.message).toContain('Duplicate request');

      // Verify only one PurchasedItem exists with this idempotencyKey
      const purchasedItems = await purchasedItemModel.find({
        idempotencyKey
      });
      expect(purchasedItems).toHaveLength(1);
      expect(purchasedItems[0]._id.toString()).toBe(firstTransactionId);
    });

    it('should handle multiple purchases with different idempotency keys', async () => {
      const idempotencyKey1 = `test-multi-1-${Date.now()}-${Math.random()}`;
      const idempotencyKey2 = `test-multi-2-${Date.now()}-${Math.random()}`;

      // First purchase
      const response1 = await request(app.getHttpServer())
        .post('/tip-grid/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipMenuItemId: tipMenuItemId.toString(),
          performerId: performerId.toString(),
          conversationId: null,
          idempotencyKey: idempotencyKey1
        })
        .expect(200);

      expect(response1.body).toHaveProperty('success', true);

      // Second purchase with different key should succeed
      const response2 = await request(app.getHttpServer())
        .post('/tip-grid/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipMenuItemId: tipMenuItemId.toString(),
          performerId: performerId.toString(),
          conversationId: null,
          idempotencyKey: idempotencyKey2
        })
        .expect(200);

      expect(response2.body).toHaveProperty('success', true);

      // Verify both PurchasedItems were created
      const item1 = await purchasedItemModel.findOne({
        idempotencyKey: idempotencyKey1
      });
      const item2 = await purchasedItemModel.findOne({
        idempotencyKey: idempotencyKey2
      });

      expect(item1).toBeDefined();
      expect(item2).toBeDefined();
      expect(item1._id.toString()).not.toBe(item2._id.toString());
    });

    it('should allow purchase without idempotency key', async () => {
      const response = await request(app.getHttpServer())
        .post('/tip-grid/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipMenuItemId: tipMenuItemId.toString(),
          performerId: performerId.toString(),
          conversationId: null
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactionId');

      const purchasedItem = await purchasedItemModel.findById(
        response.body.transactionId
      );
      expect(purchasedItem).toBeDefined();
      expect(purchasedItem.idempotencyKey).toBeUndefined();
    });

    it('should include conversationId in extraInfo when provided', async () => {
      const conversationId = new Types.ObjectId();

      const response = await request(app.getHttpServer())
        .post('/tip-grid/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tipMenuItemId: tipMenuItemId.toString(),
          performerId: performerId.toString(),
          conversationId: conversationId.toString()
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const purchasedItem = await purchasedItemModel.findById(
        response.body.transactionId
      );
      expect(purchasedItem).toBeDefined();
      expect(purchasedItem.extraInfo).toHaveProperty('conversationId');
      expect(purchasedItem.extraInfo.conversationId.toString()).toBe(
        conversationId.toString()
      );
    });
  });
});
