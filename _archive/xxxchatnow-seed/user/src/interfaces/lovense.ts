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
