import { Device } from './Device';
import { IceConnectionState } from './IceServer';

export type WebRTCAdaptorCallback = (
  info: string,
  obj: any,
  adaptor?: any
) => void;

export type WebRTCAdaptorCallbackError = (
  error: any,
  message: string,
  adaptor?: any
) => void;

export interface WebRTCAdaptor {
  getStreamInfo: (streamId: string) => void;

  closePeerConnection: (streamId: string) => void;

  publish: (streamId: string, token: string) => void;

  leave: (streamId: string) => void;

  play: (streamId: string) => void;

  stop: (streamId: string) => void;

  enableStats: (streamId: string) => void;

  disableStats: (streamId: string) => void;

  closeStream: () => void;

  closeWebSocket: () => void;

  iceConnectionState: (streamId: string) => IceConnectionState;

  forceStreamQuality: (streamId: string, resolution: number) => void;

  muteLocalMic: () => void;

  unmuteLocalMic: () => void;

  localStream: MediaStream;
}

export interface WebRTCAdaptorProps extends Omit<WebRTCAdaptor, 'localStream'> {
  classNames?: string;
  containerClassName?: string;
  initialized: boolean;
  publishStarted: boolean;
  localStream: string;
  streamResolutions: number[];
  availableDevices: Device[];
  webRTCAdaptor: any;
  initWebRTCAdaptor: (
    cb?: WebRTCAdaptorCallback,
    cbError?: WebRTCAdaptorCallbackError,
    localStream?: MediaStream
  ) => void;
  leaveSession: Function;
  startPublishing: (streamId: string) => void;
  stopPublishing: Function;
  fetchStream: (
    streamId: string,
    token: string,
    extension?: string
  ) => Promise<string>;
}
