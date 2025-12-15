import classnames from 'classnames';
import {
  AudioHTMLAttributes, createElement, useEffect, useMemo, useRef, VideoHTMLAttributes
} from 'react';

export interface HTMLMediaProps
  extends AudioHTMLAttributes<any>,
    VideoHTMLAttributes<any> {
  id: string;
  classNames?: string;
}

const defaultProps = {
  muted: true,
  controls: true,
  playsInline: true,
  autoPlay: true,
  enableDocumentPictureInPicture: true,
  preload: 'auto'
};

export function LocalStream({
  classNames = '',
  hidden,
  id,
  ...props
}: HTMLMediaProps) {
  const ref = useRef<HTMLVideoElement>();

  useEffect(() => {
    const videoEl = ref.current;
    // if (videoEl) {
    // videoEl.addEventListener('play', () => {
    //   // eslint-disable-next-line no-console
    //   console.log('Pulisher is playing');
    // });
    // }
    // find by and hide, in case videojs?
    const playerRef = document.getElementById(id);
    if (!hidden) {
      videoEl.removeAttribute('hidden');
      if (playerRef) playerRef.removeAttribute('hidden');
    } else {
      videoEl.setAttribute('hidden', 'true');
      if (playerRef) playerRef.setAttribute('hidden', 'true');
    }
  }, [hidden]);

  const className = useMemo(() => classnames('video-js broadcaster', classNames), [classNames]);

  return createElement('video', {
    ...defaultProps,
    ...props,
    id,
    hidden,
    ref,
    className
  });
}
