import Popup from '@components/common/base/popup';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import videojs from 'video.js';

const PopupVideoDetail = forwardRef((__, parrentRef) => {
  const popup = useRef(null);

  const handler = (src: string) => {
    let video = document.querySelector('#video');
    if (!video) {
      video = document.createElement('video');
      video.setAttribute('id', 'video');
      video.setAttribute('class', 'video-js');
      video.setAttribute('autoplay', 'autoplay');
      document.querySelector('.ant-modal-body').append(video);
    }

    if (!window['video-player']) {
      window['video-player'] = videojs('video', {
        poster: '/xcam-logo-black.png',
        controls: true
      });
    }

    window['video-player'].src({ type: 'video/mp4', src });
    window['video-player'].play();
    // window['video'].on()
  };

  const onOk = () => {
    window['video-player'] = window['video-player'].pause();
    // window['video-player'].poster = '/xcam-logo-black.png';
    popup.current.setVisible(false);
  };

  const show = (videoUrl: string) => {
    popup.current.setVisible(true);
    setTimeout(() => handler(videoUrl), 500);
  };

  useImperativeHandle(parrentRef, () => ({
    show
  }), []);

  return (
    <Popup
      title="Video detail"
      ref={popup}
      content={null}
      onOk={onOk.bind(this)}
      onCancel={onOk.bind(this)}
    />
  );
});

export default PopupVideoDetail;
