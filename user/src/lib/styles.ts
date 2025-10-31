type P = (imageUrl: string, settings?: any, type?: string) => string;

export const getStreamBackground: P = (imageUrl, settings = {}, type = 'private') => {
  let url: string;
  switch (type) {
    case 'private':
      url = settings?.defaultPrivateCallImage || imageUrl || '/no-avatar.png';
      break;
    case 'group':
      url = settings?.defaultGroupChatImage || imageUrl || '/no-avatar.png';
      break;
    default:
      url = '/no-image.jpg';
  }
  return `url(${url})`;
};
