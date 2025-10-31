import Hls from 'hls.js';
import React, { useEffect } from 'react';

interface IProps {
  src: string;
}

function VideoPlayer({ src }: IProps) {
  useEffect(() => {
    const video = document.getElementById('video') as HTMLVideoElement;
    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: true
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        video.muted = true;
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('canplay', () => {
        video.play();
      });
    }
  }, [src]);

  return (
    <video
      height="500"
      id="video"
      controls
      style={{
        width: '100%', border: 'none', objectFit: 'contain', backgroundColor: 'black'
      }}
    />
  );
}

export default VideoPlayer;
