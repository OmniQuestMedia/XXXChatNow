/* eslint-disable camelcase */
import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import classnames from 'classnames';
import Router from 'next/router';
import { PureComponent } from 'react';
import withAntmedia from 'src/antmedia';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import {
  WebRTCAdaptorConfigs,
  WebRTCAdaptorProps
} from 'src/antmedia/interfaces';
import { LocalStream } from 'src/antmedia/LocalStream';
import { StreamSettings } from 'src/interfaces';
import { streamService } from 'src/services';
import MicControlsPlugin from 'src/videojs/mic-controls/plugin';
import videojs from 'video.js';

import style from './publisher.module.less';

interface IProps extends WebRTCAdaptorProps {
  settings: StreamSettings;
  configs: Partial<WebRTCAdaptorConfigs>;
  watermark: any;
  localStream: any;
}

class Publisher extends PureComponent<IProps> {
  private publisher: videojs.Player;

  constructor(props: IProps) {
    super(props);
  }

  componentDidMount() {
    videojs.registerPlugin('webRTCMicControlsPlugin', MicControlsPlugin);
    Router.events.on('routeChangeStart', this.onbeforeunload);
    // window.addEventListener('beforeunload', this.onbeforeunload);
  }

  componentWillUnmount() {
    Router.events.off('routeChangeStart', this.onbeforeunload);
    // window.removeEventListener('beforeunload', this.onbeforeunload);
  }

  onbeforeunload = () => {
    if (this.publisher) {
      this.publisher.dispose();
      this.publisher = undefined;
    }
  };

  async startPublishing(idOfStream: string) {
    const { webRTCAdaptor, leaveSession, settings } = this.props;
    try {
      const token = await streamService.getPublishToken({
        streamId: idOfStream,
        settings
      });
      webRTCAdaptor.publish(idOfStream, token);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
      leaveSession();
    }
  }

  // call via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  public publish(streamId: string) {
    const { initialized } = this.props;
    initialized && this.startPublishing(streamId);
  }

  // call via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  public start() {
    const { initWebRTCAdaptor, initialized, publishStarted } = this.props;
    const { localStream } = this.props;
    if (initialized && !publishStarted && localStream) {
      this.startPublishing(localStream);
    }

    initWebRTCAdaptor(this.handelWebRTCAdaptorCallback.bind(this));
  }

  handelWebRTCAdaptorCallback(info: WEBRTC_ADAPTOR_INFORMATIONS) {
    if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_STARTED || info === WEBRTC_ADAPTOR_INFORMATIONS.SESSION_RESTORED_DESCRIPTION) {
      /**
       * use video js for desktop view
       * ant media will play video by localId, we dont need to add videojs layer in mobile
       */
      // if (!isMobile) {
      //   const { configs, muteLocalMic, unmuteLocalMic } = this.props;
      //   const player = videojs(configs.localVideoId, {
      //     liveui: true,
      //     controls: true,
      //     muted: true,
      //     bigPlayButton: false,
      //     controlBar: {
      //       volumePanel: false,
      //       playToggle: false,
      //       fullscreenToggle: true,
      //       currentTimeDisplay: false,
      //       pictureInPictureToggle: false,
      //       liveDisplay: false
      //     }
      //   }, () => {
      //     player.hasStarted(true);
      //     if (player.hasPlugin('webRTCMicControlsPlugin')) {
      //       player.webRTCMicControlsPlugin({
      //         muteLocalMic,
      //         unmuteLocalMic,
      //         isMicMuted: false
      //       });
      //     }
      //     this.publisher = player;
      //   });
      //   player.on('error', () => {
      //     player.error(null);
      //   });
      // }
      // if (!isMobile) {
      //   const { configs, muteLocalMic, unmuteLocalMic } = this.props;
      //   const player = videojs(configs.localVideoId, {
      //     liveui: true,
      //     controls: true,
      //     muted: true,
      //     bigPlayButton: false,
      //     controlBar: {
      //       playToggle: false,
      //       currentTimeDisplay: false,
      //       volumePanel: false
      //     }
      //   }, () => {
      //     player.hasStarted(true);
      //     if (player.hasPlugin('webRTCMicControlsPlugin')) {
      //       player.webRTCMicControlsPlugin({
      //         muteLocalMic,
      //         unmuteLocalMic,
      //         isMicMuted: false
      //       });
      //     }
      //     this.publisher = player;
      //   });
      //   player.on('error', () => {
      //     player.error(null);
      //   });
      // }

      setTimeout(() => {
        this.update();
      }, 3000);
    }
  }

  async update() {
    const {
      watermark, configs, webRTCAdaptor, localStream
    } = this.props;
    if (watermark && watermark.watermarkStreamEnabled && watermark.watermarkImage) {
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      canvas.id = 'canvas';
      const c = document.getElementById('publisher-contener');
      const video = document.createElement('video');
      c.append(canvas);
      c.append(video);
      const image = new Image();
      image.src = watermark.watermarkImage;
      image.crossOrigin = 'anonymous';

      image.hidden = true;
      video.hidden = true;
      canvas.hidden = true;

      let ctx = canvas.getContext('2d');

      setInterval(() => {
        ctx = canvas.getContext('2d');

        canvas.width = 600;
        canvas.height = 480;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (watermark.type === 'text') {
          ctx.font = `${watermark.watermarkFontSize}px Arial`;
          const text = watermark.watermarkText;

          ctx.fillStyle = watermark.watermarkColor;

          ctx.fillText(text, watermark.watermarkLeft, canvas.height - watermark.watermarkTop);
        }

        if (watermark.type === 'image') {
          ctx.drawImage(image, 400, 380, 150, 100);
        }
      }, 25);

      const canvasStream = canvas.captureStream(30);

      const vid = document.createElement('video') as HTMLVideoElement;
      vid.id = configs.localVideoId;
      vid.controls = true;
      vid.autoplay = true;
      vid.hidden = true;
      vid.srcObject = canvasStream;
      c.append(vid);

      vid.play();

      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play();
        };

        canvasStream.addTrack(stream.getAudioTracks()[0]);

        webRTCAdaptor.updateVideoTrack(canvasStream, localStream);
      });
    }

    if (watermark && watermark.watermarkStreamEnabled && watermark.type === 'text') {
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      canvas.id = 'canvas';
      const c = document.getElementById('publisher-contener');
      const video = document.createElement('video');
      c.append(canvas);
      c.append(video);

      video.hidden = true;
      canvas.hidden = true;

      let ctx = canvas.getContext('2d');

      setInterval(() => {
        ctx = canvas.getContext('2d');

        canvas.width = 600;
        canvas.height = 480;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        ctx.font = `${watermark.watermarkFontSize}px Arial`;
        const text = watermark.watermarkText;

        ctx.fillStyle = watermark.watermarkColor;

        ctx.fillText(text, watermark.watermarkLeft, canvas.height - watermark.watermarkTop);
      }, 25);

      const canvasStream = canvas.captureStream(30);

      const vid = document.createElement('video') as HTMLVideoElement;

      vid.id = configs.localVideoId;
      vid.controls = true;
      vid.autoplay = true;
      vid.hidden = true;
      vid.srcObject = canvasStream;
      c.append(vid);

      vid.play();

      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play();
        };

        canvasStream.addTrack(stream.getAudioTracks()[0]);

        webRTCAdaptor.updateVideoTrack(canvasStream, localStream);
      });
    }
  }

  render() {
    const {
      publishStarted,
      classNames,
      configs: { localVideoId }
    } = this.props;
    return (
      <div id="publisher-contener">
        <LocalStream
          id={localVideoId}
          hidden={!publishStarted}
          classNames={classnames(classNames, 'vjs-16-9')}
        />
        {publishStarted && (
          <div className="text-center">
            <span className={style.publishing}>Publishing</span>
          </div>
        )}
      </div>
    );
  }
}

export const LivePublisher = withAntmedia<{
  watermark: any
}>(Publisher);
export default LivePublisher;
