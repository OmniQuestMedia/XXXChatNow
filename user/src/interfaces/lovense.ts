export interface ToyJson {
  id: string;
  name: string;
  nickName: string;
  battery: number;
  version: string;
  status: string;
}

// eslint-disable-next-line no-shadow
export enum ToyConnectionStatus {
  Disconnected = 0,
  Connected = 1
}

export interface LanLovenseToy {
  [domain: string]: {
    deviceId: string;
    domain: string;
    httpPort: string;
    wsPort: string;
    httpsPort: string;
    wssPort: string;
    appType: String,
    appVersion: String,
    version: String,
    platform: String,
    toys: {
      [toyId: string]: {
        id: string;
        name: string;
        nickName: string;
        battery: number;
        version: string;
        status: number;
      };
    };
  };
}

export declare type LovenseWebsocketMessageType = 'OK' | 'move' | 'toysync' | 'toystatus';
export interface LovenseWebsocketMessageData {
  type: LovenseWebsocketMessageType;
  data: Record<string, any>;
}
export interface LovenseDevice {
  _id: string;

  performerId: string;

  lovenseToyId: string;

  lovenseDeviceId: string;

  status: string;

  nickName: string;

  name: string;

  domain: string;

  httpPort: string;

  wsPort: string;

  wssPort: string;

  httpsPort: string;

  toyJson: ToyJson;

  createdAt: Date;

  updatedAt: Date;
}

export interface LovenseSetting {
  _id: string;

  key?: string;

  deviceId: string;

  deviceInfo: any;

  performerId: string;

  level: number;

  token: number;

  reactionTime: number;

  speed: number;

  command: string;

  status: string;

  createdAt?: Date;

  updatedAt?: Date;
}

// Lovense Activate Envelope - matches canonical payload from backend
export interface LovenseActivateEnvelope {
  eventName: 'TipActivated';
  eventId: string;
  tipId: string;
  timestamp: string;
  ledger: {
    ledgerId: string;
    sourceRef: string;
    debitRef: string;
    creditRef: string;
    status: 'SETTLED';
  };
  room: {
    roomId: string;
    broadcastId: string;
  };
  model: {
    modelId: string;
    modelDisplayName: string;
    lovenseMode: 'EXTENSION' | 'CAM_KIT';
    viewerSyncMode: 'OFF' | 'SHARED_MOMENT' | 'VIP_ROOM_SYNC';
  };
  tipper: {
    userId: string;
    username: string;
    membershipTier: 'FREE' | 'VIP_SILVER' | 'VIP_GOLD' | 'VIP_PLATINUM' | 'VIP_DIAMOND';
    isVip: boolean;
  };
  transaction: {
    currency: 'TOKENS';
    amount: number;
  };
  item: {
    itemType: 'TIP' | 'MENU_ITEM';
    itemId: string;
    itemName: string;
    descriptionPublic: string;
    vibration?: {
      type: 'LEVEL' | 'PRESET' | 'PATTERN';
      strength?: number;
      durationSec?: number;
      presetName?: string;
      pattern?: any;
    };
    bonusPoints: number;
  };
  viewerSync: {
    tipperToyConnected: boolean;
    tipperReactToMyTips: boolean;
    tipperFeelAllTips: boolean;
  };
  routing: {
    targets: Array<
      | { type: 'MODEL_TOY'; modelId: string }
      | { type: 'TIPPER_TOY'; userId: string }
      | { type: 'VIP_VIEWER_TOY'; userId: string }
    >;
  };
}
