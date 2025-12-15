import { IVideoUpdate } from 'src/interfaces';

interface IProps {
  video?: IVideoUpdate;
  style?: Record<string, string>;
}

export function ThumbnailVideo({
  video = null,
  style = null
}: IProps) {
  const { thumbnail, video: videoObj } = video;
  const url = thumbnail || (videoObj?.thumbnails?.length > 0
    ? videoObj.thumbnails[0]
    : '/video.png');
  return <img src={url} style={style || { width: 90 }} alt="video" />;
}
