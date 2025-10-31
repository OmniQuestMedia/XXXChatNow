import Router from 'next/router';
import React, { PureComponent } from 'react';
import { isMobile } from 'react-device-detect';
import withAntmedia from 'src/antmedia';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import { WebRTCAdaptorConfigs, WebRTCAdaptorProps } from 'src/antmedia/interfaces';
import { StreamSettings } from 'src/interfaces';
import { streamService } from 'src/services';
import { SocketContext } from 'src/socket';
import { ISocketContext } from 'src/socket/SocketContext';
import videojs from 'video.js';

interface IProps extends WebRTCAdaptorProps {
  settings: StreamSettings;
  configs: Partial<WebRTCAdaptorConfigs>;
}

interface States {
  conversationId: string;
  streamId: string;
}

class Publisher extends PureComponent<IProps, States> {
  private socket;

  private publisher: videojs.Player;

  private videoRef = null;

  constructor(props: IProps) {
    super(props);
    this.state = {
      conversationId: null,
      streamId: null
    };
  }

  componentDidMount() {
    const { getSocket } = this.context as ISocketContext;
    this.socket = getSocket();
    Router.events.on('routeChangeStart', this.onbeforeunload);
    window.addEventListener('beforeunload', this.onbeforeunload);

    this.showHidePlayer();
  }

  componentDidUpdate(prevProps: Readonly<IProps>): void {
    const { publishStarted } = this.props;
    const { publishStarted: oldStarted } = prevProps;

    if (publishStarted !== oldStarted) {
      this.showHidePlayer();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
    Router.events.off('routeChangeStart', this.onbeforeunload);
  }

  onbeforeunload = () => {
    const { publishStarted, webRTCAdaptor } = this.props;
    const { conversationId, streamId } = this.state;
    if (streamId && publishStarted) {
      webRTCAdaptor && webRTCAdaptor.leaveFromRoom(conversationId);
      this.socket.emit('private-stream/leave', {
        conversationId,
        streamId
      });
    }

    if (this.publisher) {
      this.publisher.dispose();
      this.publisher = undefined;
    }

    this.setState({
      conversationId: null,
      streamId: null
    });
  };

  showHidePlayer() {
    const { publishStarted, configs } = this.props;
    const videoEl = this.videoRef;
    if (!videoEl) return;
    const playerRef = document.getElementById(configs.localVideoId);
    if (publishStarted) {
      videoEl.removeAttribute('hidden');
      if (playerRef) playerRef.removeAttribute('hidden');
    } else {
      videoEl.setAttribute('hidden', 'true');
      if (playerRef) playerRef.setAttribute('hidden', 'true');
    }
  }

  async handelWebRTCAdaptorCallback(info: WEBRTC_ADAPTOR_INFORMATIONS, obj: any) {
    const {
      webRTCAdaptor, settings, configs
    } = this.props;
    const { conversationId, streamId } = this.state;
    if (info === WEBRTC_ADAPTOR_INFORMATIONS.INITIALIZED) {
      webRTCAdaptor.joinRoom(conversationId, streamId);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.JOINED_THE_ROOM) {
      const token = await streamService.getPublishToken({ streamId, settings });
      webRTCAdaptor.publish(streamId, token);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_STARTED || info === WEBRTC_ADAPTOR_INFORMATIONS.SESSION_RESTORED_DESCRIPTION) {
      if (!isMobile) {
        const player = videojs(configs.localVideoId, {
          liveui: true,
          controls: true,
          muted: true,
          bigPlayButton: false,
          controlBar: {
            playToggle: false,
            currentTimeDisplay: false,
            fullscreenToggle: false,
            pictureInPictureToggle: false,
            volumePanel: false
          }
        });
        player.on('error', () => {
          player.error(null);
        });
        player.one('play', () => {
          this.publisher = player;
        });
      }
      const { getSocket } = this.context as ISocketContext;
      this.socket = getSocket();
      this.socket.emit('private-stream/join', {
        conversationId,
        streamId: obj.streamId
      });
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_FINISHED) {
      this.socket.emit('private-stream/leave', {
        conversationId,
        streamId: obj.streamId
      });
    }
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  start(conversationId: string) {
    this.setState({ conversationId });
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  publish(streamId: string) {
    const { initWebRTCAdaptor } = this.props;
    this.setState({ streamId });
    initWebRTCAdaptor(this.handelWebRTCAdaptorCallback.bind(this));
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  stop() {
    const { leaveSession } = this.props;
    leaveSession && leaveSession();
  }

  render() {
    const { publishStarted, configs } = this.props;

    return (
      <video
        id={configs.localVideoId}
        className="video-js broadcaster"
        hidden={!publishStarted}
        autoPlay
        playsInline
        muted
        ref={(ref) => { this.videoRef = ref; }}
      />
    );
  }
}

Publisher.contextType = SocketContext;
export default withAntmedia(Publisher);
