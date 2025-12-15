import { IBannerUpdate } from 'src/interfaces';

interface IProps {
  banner?: IBannerUpdate;
  style?: Record<string, string>;
}

export function ThumbnailBanner({ banner, style }: IProps) {
  const { photo } = banner;
  const urlThumb = photo ? photo.url : '/camera.png';
  return <img src={urlThumb} style={style || { width: 100 }} alt="thumb" />;
}
