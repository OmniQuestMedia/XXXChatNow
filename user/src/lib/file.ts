import { message } from 'antd';
import { RcFile } from 'antd/lib/upload';
import getConfig from 'next/config';

export function beforeAvatarUpload(file: RcFile): boolean {
  const ext = file.name.split('.').pop().toLowerCase();
  const { publicRuntimeConfig: config } = getConfig();
  const isImageAccept = config.IMAGE_ACCPET
    .split(',')
    .map((item: string) => item.trim())
    .indexOf(`.${ext}`);
  if (isImageAccept === -1) {
    message.error(`You can only upload ${config.IMAGE_ACCPET} file!`);
    return false;
  }

  const isLt2M = file.size / 1024 / 1024 < (config.MAXIMUM_SIZE_UPLOAD_AVATAR || 2);
  if (!isLt2M) {
    message.error(
      `Image must smaller than ${config.MAXIMUM_SIZE_UPLOAD_AVATAR || 2}MB!`
    );
    return false;
  }

  return true;
}
