import { DEFAULT_OFFLINE_IMAGE_URL } from '@lib/stream';
import { getResponseError } from '@lib/utils';
import { Button, message } from 'antd';
import classnames from 'classnames';
import Router from 'next/router';
import React from 'react';
import { isMobile } from 'react-device-detect';
import withAntMedia from 'src/antmedia';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import {
  WebRTCAdaptorConfigs,
  WebRTCAdaptorProps
} from 'src/antmedia/interfaces';
import { IPerformer, StreamSettings } from 'src/interfaces';
import { streamService } from 'src/services';
import videojs from 'video.js';

import styles from './subscriber.module.less';

interface IProps extends WebRTCAdaptorProps {
  settings: StreamSettings;
  configs: Partial<WebRTCAdaptorConfigs>;
  performer?: IPerformer;
  checkUserLogin: boolean;
}

const DEFAULT_IMAGE_URL = DEFAULT_OFFLINE_IMAGE_URL;

class Subscriber extends React.PureComponent<IProps> {
  private streamId: string;

  private onTrack: string;

  private player: videojs.Player;

  private getLiveStreamOrVodURLInterval: NodeJS.Timeout;

  private playerNode: HTMLVideoElement;

  componentDidMount() {
    document.addEventListener('scroll', this.trackScrolling);
    Router.events.on('routeChangeStart', this.onbeforeunload);
  }

  componentWillUnmount() {
    Router.events.off('routeChangeStart', this.onbeforeunload);
    document.removeEventListener('scroll', this.trackScrolling);
    if (this.getLiveStreamOrVodURLInterval) {
      clearInterval(this.getLiveStreamOrVodURLInterval);
      this.getLiveStreamOrVodURLInterval = null;
    }
  }

  trackScrolling = () => {
    const { performer } = this.props;
    const wrappedStreamElement = document.getElementById('video-stream-container');
    const wrappedStreamColElement = document.getElementById('public-stream-col');
    if (performer?.streamingStatus === 'public' && wrappedStreamElement?.getBoundingClientRect().bottom < 0 && !wrappedStreamElement?.classList.contains('pip-video-container')) {
      wrappedStreamElement.classList.add('pip-video-container');
    }
    if (wrappedStreamColElement?.getBoundingClientRect().bottom > 0 && wrappedStreamElement?.classList.contains('pip-video-container')) {
      wrappedStreamElement.classList.remove('pip-video-container');
    }
  };

  onbeforeunload = () => {
    const { leaveSession } = this.props;
    this.destroyPlaybackVideo();
    leaveSession();
  };

  ended = async () => {
    this.player && this.player.error(null);
    const { settings } = this.props;
    if (!this.streamId) {
      this.resetPlaybackVideo();
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
        });
      }, 5000);
    }
  };

  async handelWebRTCAdaptorCallback(
    info: WEBRTC_ADAPTOR_INFORMATIONS,
    obj: any,
    adaptor
  ) {
    const { settings } = this.props;
    if (info === WEBRTC_ADAPTOR_INFORMATIONS.INITIALIZED) {
      if (this.streamId) {
        setTimeout(() => {
          adaptor.getStreamInfo(this.streamId);
        }, 500);
      }
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.NEW_STREAM_AVAILABLE) {
      if (this.onTrack === obj.streamId) {
        return;
      }

      if (this.player) {
        this.player.dispose();
        this.player = null;
        this.playerNode = null;
      }

      this.onTrack = obj.streamId;
      this.createRemoteVideo(obj.stream);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PLAY_FINISHED) {
      setTimeout(() => {
        adaptor.getStreamInfo(obj.streamId);
      }, 3000);
      this.onTrack = null;
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.STREAM_INFORMATION) {
      if (this.streamId && this.streamId === obj.streamId) {
        const token = await streamService.getSubscriberToken({
          streamId: obj.streamId,
          settings
        });
        adaptor.play(obj.streamId, token);
      }
    }
  }

  cbErrorHandler(error: string, msg: string, adaptor: any) {
    if (error === 'no_stream_exist') {
      const { webRTCAdaptor, initWebRTCAdaptor } = this.props;
      if (!webRTCAdaptor) {
        initWebRTCAdaptor(
          this.handelWebRTCAdaptorCallback.bind(this),
          this.cbErrorHandler.bind(this)
        );
      } else {
        this.streamId
          && setTimeout(() => {
            adaptor.getStreamInfo(this.streamId);
          }, 3000);
      }
    } else if (error === 'already_playing') {
      if (this.streamId) {
        if (!adaptor) return;

        if (isMobile) {
          if (this.playerNode) {
            this.playerNode.readyState !== 4 && adaptor.stop(this.streamId);
          } else {
            adaptor.stop(this.streamId);
          }
        } else if (this.player) {
          this.player.readyState() !== 4 && adaptor.stop(this.streamId);
        } else {
          adaptor.stop(this.streamId);
        }
      }
    }
  }

  createPlaybackideo(poster = DEFAULT_IMAGE_URL) {
    const { classNames } = this.props;
    if (!this.playerNode) {
      const video = document.createElement('video');
      video.setAttribute('id', 'subscriber');
      video.setAttribute('class', classnames('video-js vjs-16-9', classNames));
      video.autoplay = true;
      video.muted = true;
      video.controls = true;
      video.playsInline = true;
      document.querySelector('.video-container').append(video);
      this.playerNode = video;
    }

    const player = videojs(
      this.playerNode,
      {
        autoplay: true,
        liveui: true,
        muted: true,
        controls: true,
        bigPlayButton: false,
        poster,
        controlBar: {
          pictureInPictureToggle: false
        }
      },
      () => {
        if (!poster) player.addClass('vjs-waiting');
        this.player = player;
      }
    );
    player.on('ended', this.ended);
    player.on('error', this.ended);
  }

  resetPlaybackVideo(poster = DEFAULT_IMAGE_URL) {
    this.destroyPlaybackVideo();
    if (this.getLiveStreamOrVodURLInterval) {
      clearInterval(this.getLiveStreamOrVodURLInterval);
      this.getLiveStreamOrVodURLInterval = null;
    }
    this.createPlaybackideo(poster);
  }

  destroyPlaybackVideo() {
    this.streamId = null;
    this.onTrack = null;
    if (this.player) {
      this.player.dispose();
      this.player = null;
      this.playerNode = null;
    } else if (this.playerNode) {
      this.playerNode.remove();
      this.playerNode = null;
    }

    const video = document.getElementById('subscriber') as HTMLVideoElement;
    if (video) {
      video.srcObject = null;
      video.remove();
    }
  }

  createRemoteVideo(stream: any) {
    const { classNames, webRTCAdaptor } = this.props;
    if (!this.playerNode) {
      const video = document.createElement('video');
      video.setAttribute('id', 'subscriber');
      video.setAttribute('class', classnames('video-js vjs-16-9', classNames));
      video.autoplay = true;
      video.muted = true;
      video.controls = true;
      video.playsInline = true;
      document.querySelector('.video-container').append(video);
      this.playerNode = video;
    }

    this.playerNode.srcObject = stream;

    if (!isMobile) {
      const player = videojs(
        this.playerNode,
        {
          liveui: true,
          controls: true,
          autoplay: true,
          muted: true,
          bigPlayButton: false,
          controlBar: {
            volumePanel: true,
            playToggle: false,
            fullscreenToggle: true,
            currentTimeDisplay: false,
            pictureInPictureToggle: false,
            liveDisplay: true
          }
        },
        () => {
          player.hasStarted(true);
          this.player = player;
        }
      );
      player.on('error', () => {
        player.error(null);
      });
      player.on('ended', () => {
        setTimeout(() => {
          if (this.onTrack && this.player && this.player.readyState() !== 4) {
            webRTCAdaptor && webRTCAdaptor.getStreamInfo(this.onTrack);
          }
        }, 30 * 1000); // 30 seconds
      });
      player.addClass('vjs-waiting');
      return;
    }

    this.playerNode.addEventListener('ended', () => {
      setTimeout(() => {
        if (this.onTrack && this.playerNode && this.playerNode.readyState !== 4) {
          webRTCAdaptor && webRTCAdaptor.getStreamInfo(this.onTrack);
        }
      }, 30 * 1000); // 30 seconds
    });
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  async play(streamId: string) {
    if (!streamId) {
      return;
    }

    const { initWebRTCAdaptor, initialized, webRTCAdaptor } = this.props;
    this.streamId = streamId;
    if (initialized) {
      setTimeout(() => {
        webRTCAdaptor.getStreamInfo(streamId);
      }, 500);
      return;
    }

    initWebRTCAdaptor(
      this.handelWebRTCAdaptorCallback.bind(this),
      this.cbErrorHandler.bind(this)
    );
  }

  async playHLS(streamId: string, streamHeight = 0) {
    if (!streamId) return;

    // streamid played
    if (this.streamId === streamId) return;

    if (!this.player) {
      this.createPlaybackideo();
    }

    if (this.getLiveStreamOrVodURLInterval) {
      clearInterval(this.getLiveStreamOrVodURLInterval);
      this.getLiveStreamOrVodURLInterval = null;
    }

    const { configs, settings } = this.props;
    const appName = configs.appName || settings.AntMediaAppname;
    this.streamId = streamId;
    const src = await streamService.getLiveStreamOrVodURL(
      {
        appName,
        settings,
        streamId
      },
      streamHeight
    );
    if (!src) {
      return;
    }

    setTimeout(() => {
      if (!this.player) return;

      this.player.addClass('vjs-waiting');
      this.player.src({
        type: 'application/x-mpegURL',
        src
      });
      this.player.play();
      this.player.controls(true);
    }, 500);
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  stop(poster = DEFAULT_IMAGE_URL) {
    const { leaveSession } = this.props;
    this.resetPlaybackVideo(poster);
    leaveSession();
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  poster(src: string) {
    if (this.player) {
      this.player.removeClass('vjs-waiting');
      this.player.poster(src);
    } else if (this.playerNode) {
      this.playerNode.poster = src;
    }
  }

  async peekIn() {
    const { performer, checkUserLogin } = this.props;

    if (!checkUserLogin) {
      message.error(`Please login to peek in ${performer.username} private chat!`);
      return;
    }

    try {
      const resp = await streamService.peekIn(performer._id);
      Router.push(`/stream/peek-in/${resp.data._id}`);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  render() {
    const { performer } = this.props;
    return (
      <div className={styles['video-wrapper']}>
        <div className="video-container" />
        {performer?.streamingStatus === 'private' && performer?.enablePeekIn
          && (
            <div className={styles['private-wrapper']}>
              <span className={styles['private-title']}>
                {performer.username}
                {' '}
                is
                {' '}
                <span className={styles['private-status']}>live</span>
                {' '}
                with a Private Show.
              </span>
              <span className={styles['private-text']}>Dont worry, you can join in  on the fun.</span>
              <Button className={styles['private-btn']} onClick={this.peekIn.bind(this)}>
                <img alt="" src="/icons/spy-icon.svg" style={{ marginRight: '5px' }} />
                Spy on this Private Show
              </Button>
            </div>
          )}
      </div>
    );
  }
}

export default withAntMedia(Subscriber);
