/* eslint-disable camelcase */
import { getResponseError } from '@lib/utils';
import { currentUserSelector } from '@redux/selectors';
import { Button, message } from 'antd';
import classNames from 'classnames';
import { uniq } from 'lodash';
import Router from 'next/router';
import React, {
  forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState
} from 'react';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import withAntmedia from 'src/antmedia';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import { WebRTCAdaptorConfigs, WebRTCAdaptorProps } from 'src/antmedia/interfaces';
import { IUser, StreamSettings } from 'src/interfaces';
import { streamService } from 'src/services';
import { SocketContext } from 'src/socket';
import videojs from 'video.js';

import style from './group-streaming-container.module.less';

const STREAM_JOINED = 'private-stream/streamJoined';
const STREAM_LEFT = 'private-stream/streamLeft';
const JOINED_THE_ROOM = 'JOINED_THE_ROOM';

interface IProps extends WebRTCAdaptorProps {
  onClick: any;
  settings: StreamSettings;
  configs: Partial<WebRTCAdaptorConfigs>;
  performer: any;
  // eslint-disable-next-line react/require-default-props
  requestFromUser?: boolean;
}

const GroupStreamingContainer2 = forwardRef((props: IProps, ref) => {
  const [loading, setLoading] = useState(false);
  const {
    socketStatus, socket, connected, getSocket
  } = useContext(SocketContext);
  const publisher = useRef(null);
  const publisherVideoRef = useRef(null);
  const conversationIdRef = useRef(null);
  const streamIdRef = useRef(null);
  const streamListRef = useRef([]);
  const players = useRef<Record<string, videojs.Player>>({});
  const getLiveStreamOrVodURLInterval = useRef<Record<string, NodeJS.Timeout>>({});
  const currentUser = useSelector(currentUserSelector) as IUser;

  const {
    initWebRTCAdaptor,
    settings,
    configs,
    leaveSession,
    publishStarted,
    onClick,
    initialized,
    performer,
    requestFromUser = false
  } = props;

  const onStartClick = async () => {
    if (currentUser.balance < performer?.groupCallPrice) {
      message.error('Oops, you don’t have enough tokens');
    }

    try {
      setLoading(true);
      await onClick();
    } catch {
      setLoading(false);
    }
  };

  const start = (sessionId: string, idConversation: string) => {
    conversationIdRef.current = idConversation;
  };

  const leave = () => {
    message.info('Streaming stopped. Redirect to homepage in 3 seconds');

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  };

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  const stop = () => {
    leaveSession();
  };

  const ended = async (streamId) => {
    players.current[streamId] && players.current[streamId].error(null);
    try {
      const stream = await streamService.getStream(streamId);
      if (stream.data.status === 'finished') {
        throw new Error('Disconnected');
      }

      const src = await streamService.getLiveStreamOrVodURL({
        streamId,
        settings,
        appName: settings.AntMediaAppname
      });
      if (src) {
        if (getLiveStreamOrVodURLInterval.current[streamId]) {
          clearInterval(getLiveStreamOrVodURLInterval.current[streamId]);
        }

        getLiveStreamOrVodURLInterval.current[streamId] = setInterval(() => {
          fetch(src, { method: 'HEAD' }).then(() => {
            if (players.current[streamId]) {
              players.current[streamId].src({
                type: 'application/x-mpegURL',
                src
              });
              players.current[streamId].play();

              if (getLiveStreamOrVodURLInterval.current[streamId]) {
                clearInterval(getLiveStreamOrVodURLInterval.current[streamId]);
              }
            }
          });
        }, 5000);
      }
    } catch {
      const newList = streamListRef.current.filter((id) => id !== streamId);
      streamListRef.current = newList;

      if (players.current[streamId]) {
        players.current[streamId].dispose();
        delete players.current[streamId];
      }

      if (performer && streamId.indexOf(performer._id) !== -1) {
        message.info('Group stream has ended.. Redirect to homepage in 3 seconds');

        setTimeout(() => {
          window.location.href = '/';
        }, 3 * 1000);
      }
    }
  };

  const handelWebRTCAdaptorCallback = async (info: WEBRTC_ADAPTOR_INFORMATIONS, obj: any, adaptor) => {
    if (info === WEBRTC_ADAPTOR_INFORMATIONS.INITIALIZED) {
      const token = await streamService.getPublishToken({
        streamId: streamIdRef.current,
        settings
      });
      adaptor.publish(streamIdRef.current, token);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_STARTED || info === WEBRTC_ADAPTOR_INFORMATIONS.SESSION_RESTORED_DESCRIPTION) {
      // user publish local video
      socket.emit('private-stream/join', {
        conversationId: conversationIdRef.current,
        streamId: obj.streamId
      });
      if (!isMobile) {
        const player = videojs(configs.localVideoId, {
          liveui: true,
          controls: true,
          muted: true,
          bigPlayButton: false,
          // controlBar: {
          //   playToggle: false,
          //   currentTimeDisplay: false,
          //   fullscreenToggle: false,
          //   pictureInPictureToggle: false,
          //   volumePanel: false
          // }
          controlBar: false
        });
        player.on('error', () => {
          player.error(null);
        });
        player.one('play', () => {
          publisher.current = player;
        });
      } else {
        publisherVideoRef.current.style.width = '100%';
      }
      setLoading(false);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_FINISHED) {
      if (publisher.current) {
        publisher.current.dispose();
        publisher.current = undefined;
      }

      socket.emit('private-stream/leave', {
        conversationId: conversationIdRef.current,
        streamId: obj.streamId
      });
      setLoading(false);
    }
  };

  const onReadyCallback = async (streamId: string) => {
    try {
      const appName = configs.appName || settings.AntMediaAppname;
      const src = await streamService.getLiveStreamOrVodURL({
        appName,
        settings,
        streamId
      });
      if (!src) {
        return;
      }

      if (!players.current[streamId]) {
        players.current[streamId] = videojs(
          streamId,
          {
            liveui: true,
            height: 100,
            // width: container.offsetWidth / 4,
            muted: streamId === streamIdRef.current,
            bigPlayButton: false,
            controls: true,
            // controlBar: {
            //   volumePanel: {
            //     inline: false,
            //     volumeControl: {
            //       vertical: false
            //     }
            //   },
            //   playToggle: false,
            //   liveDisplay: false,
            //   currentTimeDisplay: false,
            //   fullscreenToggle: false,
            //   pictureInPictureToggle: false
            // }
            controlBar: false
          },
          () => onReadyCallback(streamId)
        );
        return;
      }

      players.current[streamId].addClass('vjs-waiting');
      players.current[streamId].on('ended', () => ended(streamId));
      players.current[streamId].on('error', () => ended(streamId));

      // TODO - check timeout
      setTimeout(() => {
        if (!players.current[streamId]) return;
        players.current[streamId].src({
          type: 'application/x-mpegURL',
          src
        });
        players.current[streamId].play();
      });
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  };

  // handle event when current user join the room,
  // then load all videos of users and display
  const handle_JOINED_THE_ROOM = (data) => {
    const { streamList, conversationId: _id } = data;
    if (_id !== conversationIdRef.current) return;

    // check performer and compare with current stream ID format (type-streamid-userid)
    // and decide container wrapper
    // const performer = members.find((m) => m.isPerformer);

    // setStreamId(data.streamId);
    setLoading(true);

    streamIdRef.current = data.streamId;

    streamListRef.current = data.streamList;
    initWebRTCAdaptor(handelWebRTCAdaptorCallback);
    if (streamList.length) {
      uniq(streamList).forEach((id: string) => {
        const aggs = id.split('-');
        const userId = aggs[aggs.length - 1];
        const containerWrapperId = performer?._id === userId ? 'main-video' : 'sub-viewers';

        const player = document.createElement('video') as HTMLVideoElement;
        const container = document.getElementById(containerWrapperId);
        player.setAttribute('id', id);
        // player.setAttribute('controls', 'false');
        player.controls = true;
        player.playsInline = true;
        player.setAttribute('class', 'video-js broadcaster');
        player.setAttribute('autoplay', 'autoplay');
        container.append(player);
        players.current[id] = videojs(
          id,
          {
            liveui: true,
            height: 100,
            width: container.offsetWidth / 4,
            bigPlayButton: true,
            controls: true
            // controlBar: {
            //   volumePanel: {
            //     inline: false,
            //     volumeControl: {
            //       vertical: false
            //     }
            //   },
            //   playToggle: false,
            //   liveDisplay: false,
            //   currentTimeDisplay: false,
            //   fullscreenToggle: false,
            //   pictureInPictureToggle: false
            // }
          },
          () => onReadyCallback(id)
        );
      });
    }
  };

  const handle_STREAM_LEFT = (data: { streamId: string; conversationId: string }) => {
    if (
      conversationIdRef.current !== data.conversationId
      || streamIdRef.current === data.streamId
    ) return;

    const newList = streamListRef.current.filter((id) => id !== data.streamId);
    streamListRef.current = newList;

    if (players.current[data.streamId]) {
      players.current[data.streamId].dispose();
      delete players.current[data.streamId];
    }
  };

  // when having new member join the group call
  const handle_STREAM_JOINED = (data: { streamId: string; conversationId: string, user: any }) => {
    if (conversationIdRef.current !== data.conversationId) return;
    if (streamIdRef.current !== data.streamId) {
      const newList = [
        ...streamListRef.current,
        data.streamId
      ];
      // TODO - recheck me, if model publish stream already and don't need to publish stream here?
      // const containerWrapperId = currentUser.isPerformer || user?.isPerformer ? 'main-video' : 'sub-viewers';

      streamListRef.current = newList;
      const player = document.createElement('video') as HTMLVideoElement;
      const container = document.getElementById('sub-viewers');
      player.setAttribute('id', data.streamId);
      // player.setAttribute('controls', 'false');
      player.controls = true;
      player.playsInline = true;
      player.setAttribute('class', 'video-js broadcaster');
      player.setAttribute('autoplay', 'autoplay');
      container.append(player);
      players.current[data.streamId] = videojs(
        data.streamId,
        {
          liveui: true,
          height: 100,
          width: container.offsetWidth / 4,
          muted: data.streamId === streamIdRef.current,
          bigPlayButton: true,
          controls: true
          // controlBar: {
          //   volumePanel: {
          //     inline: false,
          //     volumeControl: {
          //       vertical: false
          //     }
          //   },
          //   playToggle: false,
          //   liveDisplay: false,
          //   currentTimeDisplay: false,
          //   fullscreenToggle: false,
          //   pictureInPictureToggle: false
          // }
        },
        () => onReadyCallback(data.streamId)
      );
    }
  };

  const initSocketEvent = () => {
    socket.on(JOINED_THE_ROOM, handle_JOINED_THE_ROOM);
    socket.on(STREAM_LEFT, handle_STREAM_LEFT);
    socket.on(STREAM_JOINED, handle_STREAM_JOINED);
  };

  const offSocketEvent = () => {
    socket?.off(JOINED_THE_ROOM, handle_JOINED_THE_ROOM);
    socket?.off(STREAM_LEFT, handle_STREAM_LEFT);
    socket?.off(STREAM_JOINED, handle_STREAM_JOINED);
  };

  const leaveStream = () => {
    if (streamIdRef.current) {
      const mySocket = getSocket();
      mySocket.emit('private-stream/leave', {
        conversationId: conversationIdRef.current,
        streamId: streamIdRef.current
      });
    }

    Object.keys(getLiveStreamOrVodURLInterval.current).forEach((id) => {
      if (getLiveStreamOrVodURLInterval.current[id]) clearInterval(getLiveStreamOrVodURLInterval.current[id]);
      delete getLiveStreamOrVodURLInterval.current[id];
    });

    if (publisher.current) {
      publisher.current.dispose();
      publisher.current = undefined;
    }
    Object.keys(players.current).forEach((id) => {
      if (players.current[id]) {
        players.current[id].dispose();
        players.current[id] = undefined;
      }
    });
    offSocketEvent();

    streamIdRef.current = null;
    streamListRef.current = [];
    conversationIdRef.current = null;
  };

  const onbeforeunload = () => {
    leaveStream();
  };

  const renderLocalVideo = () => (
    <div id="local-video">
      <video
        ref={publisherVideoRef}
        id={configs.localVideoId}
        className="video-js broadcaster"
        hidden={!initialized}
        muted
        controls={false}
        autoPlay
        playsInline
      />
    </div>
  );

  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    start,
    stop,
    leave,
    ended
  }));

  useEffect(() => {
    Router.events.on('routeChangeStart', onbeforeunload);
    window.addEventListener('beforeunload', onbeforeunload);

    return () => {
      Router.events.off('routeChangeStart', onbeforeunload);
      window.removeEventListener('beforeunload', onbeforeunload);
    };
  }, []);

  useEffect(() => {
    if (connected()) {
      initSocketEvent();
    }

    return () => {
      offSocketEvent();
    };
  }, [socketStatus]);

  return (
    <div className={classNames(style['stream-group-main'], { [style.streaming_group_show]: publishStarted && initialized })}>
      <div className="button-streaming">
        {requestFromUser && performer?.isOnline && (
          !initialized ? (
            <Button
              type="primary"
              onClick={onStartClick}
              loading={loading}
              disabled={loading}
              block
            >
              Join Group chat
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={leave}
              loading={loading}
              disabled={loading}
              block
            >
              Stop Streaming
            </Button>
          )
        )}

        {!requestFromUser && (
          !initialized ? (
            <Button
              type="primary"
              onClick={onStartClick}
              loading={loading}
              disabled={loading}
              block
            >
              Start Group chat
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={leave}
              loading={loading}
              disabled={loading}
              block
            >
              Stop Streaming
            </Button>
          )
        )}

      </div>
      <div style={{ position: 'relative' }} className="stream-group">
        <div id="group-video-container">
          {/* Hold video of model */}
          <div id="main-video">
            {currentUser.isPerformer && renderLocalVideo()}
          </div>

          <div id="sub-viewers">
            {!currentUser.isPerformer && renderLocalVideo()}
          </div>

        </div>
      </div>
    </div>
  );
});

export default withAntmedia(GroupStreamingContainer2);
