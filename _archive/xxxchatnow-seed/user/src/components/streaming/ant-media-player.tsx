// import './index.module.less';

import { generateUuid } from '@lib/string';
import classnames from 'classnames';
import fetch from 'isomorphic-unfetch';
import React from 'react';
import withAntMedia from 'src/antmedia';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import { WebRTCAdaptorConfigs, WebRTCAdaptorProps } from 'src/antmedia/interfaces';
import { StreamSettings } from 'src/interfaces';
import { streamService } from 'src/services';
import videojs from 'video.js';

interface IProps extends WebRTCAdaptorProps {
  settings: StreamSettings;
  configs: Partial<WebRTCAdaptorConfigs>;
}

class AntMediaPlayer extends React.PureComponent<IProps> {
  private videoContainerRef: React.RefObject<HTMLDivElement>;

  private streamId: string;

  private player: videojs.Player;

  private activeStreams = [];

  private getLiveStreamOrVodURLInterval: NodeJS.Timeout;

  private id = `player-${generateUuid()}`;

  componentDidMount() {
    this.videoContainerRef = React.createRef<HTMLDivElement>();
  }

  

  componentWillUnmount() {
    this.getLiveStreamOrVodURLInterval
      && clearInterval(this.getLiveStreamOrVodURLInterval);
    this.player && this.player.dispose();
  }

  async handler(info: WEBRTC_ADAPTOR_INFORMATIONS, obj: any) {
    const { webRTCAdaptor, settings } = this.props;
    if (info === WEBRTC_ADAPTOR_INFORMATIONS.INITIALIZED) {
      const token = await streamService.getSubscriberToken({
        streamId: this.streamId,
        settings
      });
      webRTCAdaptor.play(this.streamId, token);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.NEW_STREAM_AVAILABLE) {
      const activeStream = this.activeStreams.find((id) => id === obj.streamId);
      if (this.player) {
        this.player.dispose();
        this.player = undefined;
      }
      if (!activeStream) {
        this.activeStreams.push(obj.streamId);
        this.createRemoteVideo(obj.stream);
      }
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PLAY_FINISHED) {
      this.activeStreams = this.activeStreams.filter(
        (id) => id !== obj.streamId
      );
      this.removeRemoteVideo();
      setTimeout(() => {
        webRTCAdaptor.getStreamInfo(obj.streamId);
      }, 3000);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.STREAM_INFORMATION) {
      if (obj.streamId === this.streamId) {
        const token = await streamService.getSubscriberToken({
          streamId: obj.streamId,
          settings
        });
        webRTCAdaptor.play(obj.streamId, token);
      }
    }
  }

  createPlaybackideo(streamId: string) {
    const { classNames } = this.props;
    const video = document.createElement('video');
    video.setAttribute('id', this.id);
    video.setAttribute('class', classnames(classNames, 'subscriber broadcaster video-js'));
    video.autoplay = true;
    video.muted = true;
    video.controls = false;
    video.playsInline = true;
    video.width = this.videoContainerRef.current.offsetWidth;
    video.height = this.videoContainerRef.current.offsetHeight;
    this.videoContainerRef.current.append(video);
    this.player = videojs(this.id, {
      autoplay: true,
      liveui: true,
      controlBar: false,
      controls: false,
      bigPlayButton: false
    });
    this.player.on('ended', this.ended.bind(this));
    this.player.on('error', this.ended.bind(this));
    this.player.controls(false);
    streamId && this.playHLS(streamId);
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  resetPlaybackVideo() {
    this.streamId = '';
    if (this.player?.src()) {
      this.player.dispose();
      this.player = undefined;
    }
  }

  async cbErrorHandler(error: string) {
    if (error === 'no_stream_exist') {
      const { webRTCAdaptor, initWebRTCAdaptor } = this.props;
      if (!webRTCAdaptor) {
        initWebRTCAdaptor(
          this.handler.bind(this),
          this.cbErrorHandler.bind(this)
        );
      } else {
        this.streamId && webRTCAdaptor.getStreamInfo(this.streamId);
      }
    }
  }

  async ended() {
    this.player && this.player.error(null);
    const { settings } = this.props;
    if (!this.streamId) {
      return;
    }

    const src = await streamService.getLiveStreamOrVodURL({
      streamId: this.streamId,
      settings,
      appName: settings.AntMediaAppname
    });
    if (src) {
      this.getLiveStreamOrVodURLInterval = setInterval(() => {
        fetch(src, { method: 'HEAD' }).then(() => {
          this.playHLS(this.streamId);
          this.getLiveStreamOrVodURLInterval
            && clearInterval(this.getLiveStreamOrVodURLInterval);
        });
      }, 5000);
    }
  }

  createRemoteVideo(stream: any) {
    const { classNames } = this.props;
    const video = document.createElement('video');
    video.setAttribute('id', this.id);
    video.setAttribute('class', classnames(classNames));
    video.autoplay = true;
    video.muted = true;
    video.controls = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.width = this.videoContainerRef.current.offsetWidth;
    this.videoContainerRef.current.append(video);
  }

  removeRemoteVideo() {
    const video = document.getElementById(this.id) as HTMLVideoElement;
    if (video) {
      video.srcObject = null;
      // document.querySelector('.video-container').removeChild(video);
      this.videoContainerRef.current.removeChild(video);
    }
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  async play(streamId: string) {
    const {
      initWebRTCAdaptor,
      initialized,
      webRTCAdaptor,
      settings
    } = this.props;
    this.streamId = streamId;
    if (initialized) {
      const token = await streamService.getSubscriberToken({
        streamId,
        settings
      });
      webRTCAdaptor.play(streamId, token);
      return;
    }

    initWebRTCAdaptor(this.handler.bind(this), this.cbErrorHandler.bind(this));
  }

  async playHLS(streamId: string) {
    if (!this.player) {
      this.createPlaybackideo(streamId);
    }

    const { configs, settings } = this.props;
    const appName = configs.appName || settings.AntMediaAppname;
    this.streamId = streamId;
    this.getLiveStreamOrVodURLInterval
      && clearInterval(this.getLiveStreamOrVodURLInterval);
    const src = await streamService.getLiveStreamOrVodURL({
      appName,
      settings,
      streamId
    });
    if (!src) {
      return;
    }

    // this.player.addClass('vjs-waiting');

    setTimeout(() => {
      if (!this.player) return;
      this.player.src({
        type: 'application/x-mpegURL',
        src
      });
      this.player.play();
      this.player.controls(true);
    }, 1 * 1000);
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  stop() {
    const { leaveSession } = this.props;
    this.streamId = '';
    leaveSession && leaveSession();
  }

  render() {
    const { containerClassName, classNames } = this.props;
    return (
      <div
        className={classnames('video-container', containerClassName)}
        ref={this.videoContainerRef}
      />
    );
  }
}

export default withAntMedia(AntMediaPlayer);
