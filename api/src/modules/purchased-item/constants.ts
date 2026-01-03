/* eslint-disable no-shadow */
export const PURCHASE_ITEM_TYPE = {
  SALE_VIDEO: 'sale_video',
  PRODUCT: 'sale_product',
  PHOTO: 'sale_photo',
  TIP: 'tip',
  PRIVATE: 'stream_private',
  GROUP: 'stream_group',
  CONTRIBUTE: 'contribute',
  SPIN_WHEEL: 'spin_wheel',
  FEATURED_CREATOR: 'featured_creator',
  PEEK_IN: 'peek_in',
  EVENT_PASS: 'event_pass'

};

export enum PurchaseItemType {
  SALE_VIDEO = 'sale_video',
  PRODUCT = 'sale_product',
  PHOTO = 'sale_photo',
  TIP = 'tip',
  PRIVATE = 'stream_private',
  GROUP = 'stream_group',
  FEATURED_CREATOR = 'featured_creator'
}

export const PURCHASE_ITEM_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  CANCELLED: 'cancelled'
};

export const PURCHASE_ITEM_TARGET_TYPE = {
  PRODUCT: 'product',
  VIDEO: 'video',
  PHOTO: 'photo',
  TIP: 'tip',
  PRIVATE: 'stream_private',
  GROUP: 'stream_group',
  CONTRIBUTE: 'contribute',
  SPIN_WHEEL: 'spin_wheel',
  FEATURED_CREATOR: 'featured_creator',
  EVENT_PASS: 'event_pass'

};

export const ORDER_TOKEN_STATUS = {
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  REFUNDED: 'refunded'
};

export enum PURCHASE_ITEM_TARGET_SOURCE {
  USER = 'user'
}

export const PURCHASED_ITEM_SUCCESS_CHANNEL = 'PURCHASED_ITEM_SUCCESS_CHANNEL';
export const TIP_ACTIVATED_CHANNEL = 'TIP_ACTIVATED_CHANNEL';

export const OVER_PRODUCT_STOCK = 'OVER_PRODUCT_STOCK';
export const ITEM_NOT_PURCHASED = 'ITEM_NOT_PURCHASED';
export const ITEM_NOT_FOR_SALE = 'ITEM_NOT_FOR_SALE';
