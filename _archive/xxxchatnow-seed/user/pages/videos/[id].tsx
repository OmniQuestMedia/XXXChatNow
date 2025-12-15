import {
  ClockCircleOutlined,
  DownloadOutlined
  // HourglassOutlined
} from '@ant-design/icons';
import { updateCurrentUserBalance } from '@redux/user/actions';
import { APIRequest } from '@services/api-request';
import { Alert, Button, message } from 'antd';
import getConfig from 'next/config';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import nextCookie from 'next-cookies';
import { useRef, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import Popup from 'src/components/common/base/popup';
import { IVideo } from 'src/interfaces';
import {
  capitalizeFirstLetter,
  formatDate,
  formatDuration,
  getResponseError,
  redirect
} from 'src/lib';
import { authService, purchaseItemService, videoService } from 'src/services';

import style from './index.module.less';

const SeoMetaHead = dynamic(() => import('@components/common/seo-meta-head'));
const NumberFormat = dynamic(() => import('@components/common/layout/numberformat'));
const ProfileCard = dynamic(() => import('@components/performer/profile-card'));
// const Popup = dynamic(() => import('src/components/common/base/popup'), { ssr: false });

const mapStates = (state) => ({
  placeholderAvatarUrl: state.ui.placeholderAvatarUrl,
  loggedIn: state.auth.loggedIn,
  currentUser: state.user.current,
  currentPerformer: state.performer.current
});
const mapDispatch = {
  dispatchUpdateCurrentUserBalance: updateCurrentUserBalance
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

type IProps = {
  data: IVideo
};

function VideoDetailPage({
  data,
  loggedIn,
  currentUser,
  placeholderAvatarUrl,
  dispatchUpdateCurrentUserBalance
}: IProps & PropsFromRedux) {
  const router = useRouter();
  const popupRef = useRef<any>(null);
  const [video, setVideo] = useState(data);

  const dataSource: { title: string; description: any }[] = [
    { title: 'Posted by:', description: video.performer?.username },
    { title: 'Added on:', description: formatDate(video.createdAt) },
    { title: 'Duration:', description: formatDuration(video.video?.duration) }
  ];

  if (video.isSaleVideo) {
    dataSource.push({
      title: 'Price: ',
      description: <NumberFormat value={video.token} suffix=" Tokens" />
    });
  }

  /**
   * get details, reload detail
   */
  const getVideoDetail = async () => {
    try {
      const resp = await videoService.userFindVideoById(video._id);
      setVideo(resp.data);
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };

  const getBaseApiEndpoint = () => {
    const { API_ENDPOINT } = APIRequest;
    if (API_ENDPOINT) return API_ENDPOINT;

    const { publicRuntimeConfig } = getConfig();
    return publicRuntimeConfig.API_ENDPOINT;
  };

  const onOk = async () => {
    try {
      if (!currentUser || !currentUser._id) {
        message.error('Please login to buy this video!');
        router.push('/auth/login/user');
        return;
      }

      await purchaseItemService.purchaseVideo(video._id);
      popupRef.current.setVisible(false);
      await getVideoDetail();

      const value = -1 * data.token;
      dispatchUpdateCurrentUserBalance(value);
      message.success(`Successfully purchased video with ${data.token} tokens`);
    } catch (error) {
      // responseError(error);
    }
  };

  const purchase = () => {
    if (!loggedIn) {
      message.error('Please login to buy this video!');
      return;
    }

    popupRef.current.setVisible(true);
  };

  const download = () => {
    const baseApiEndpoint = getBaseApiEndpoint();

    const a = document.createElement('a');
    a.href = `${baseApiEndpoint}/user/performer-assets/videos/download/${encodeURIComponent(video._id)}?token=${authService.getToken()}`;
    a.target = '_blank';
    a.click();
    if (video.isBought || !video.isSaleVideo) {
      fetch(`${baseApiEndpoint}/users/download/video/${encodeURIComponent(video._id)}`, {
        method: 'GET'
      })
        .then((response) => response.blob())
        .then((blob) => {
          // Create blob link to download
          const url = window.URL.createObjectURL(
            new Blob([blob])
          );
          const e = document.createElement('a');
          e.href = url;
          // e.target = '_blank';
          e.download = video.title;
          e.rel = 'noopener noreferrer';
          document.body.appendChild(e);
          e.click();
        });
    }
  };
  return (
    <div className={style['video-detail-page']}>
      <SeoMetaHead item={video} canonical={`/videos/${video._id}`} />
      <div className={style['video-header']}>
        <div className={style['vid-title']}>{video.title}</div>
        {/* <div className={style['vid-duration']}>
              <HourglassOutlined />
              &nbsp;
              {formatDuration(video.video.duration || 0)}
            </div> */}
        <div className={style['vid-duration']}>
          <ClockCircleOutlined />
              &nbsp;
          {formatDate(video.createdAt)}
        </div>
      </div>
      <div className={style['video-player']}>
        {(!video.isSaleVideo || video.isBought) && (
          <video
            src={video.video.url}
            controls
            poster={video?.thumbnail ? video?.thumbnail : '/no-image.jpg'}
          />
        )}
        {video.isSaleVideo && !video.isBought && video.trailer && (
          <>
            <video
              src={video?.trailer.url}
              controls
              poster={video?.thumbnail ? video?.thumbnail : '/no-image.jpg'}
            />
            <p style={{ margin: '10px', textAlign: 'center' }}>
              You&apos;re watching teaser video
            </p>
          </>
        )}
        {video.isSaleVideo && !video.isBought && !video.trailer && (
          <img className={style['video-thumbnail']} src={video?.thumbnail ? video?.thumbnail : '/no-image.jpg'} alt="" />
        )}
      </div>

      <div className={style['video-stats']}>
        {video?.isSaleVideo && !video.isBought && (
          <Button
            type="primary"
            htmlType="button"
            onClick={purchase}
          >
            Buy Video
          </Button>
        )}
        {((loggedIn && video?.isBought) || (loggedIn && !video?.isSaleVideo)) && (
          <Button
            type="dashed"
            htmlType="button"
            onClick={download}
          >
            <DownloadOutlined />
            {' '}
            Download
          </Button>
        )}
      </div>
      {video?.isSaleVideo && !video?.isBought && (
        <div style={{ margin: '10px 0' }}>
          <Alert
            message="To view full content, please buy this video!"
            type="error"
          />
        </div>
      )}
      <div className={style['video-info']}>
        <div className={style['video-description']}>
          {video?.description || 'No video description'}
        </div>
      </div>
      {video.performer && (
        <ProfileCard
          placeholderAvatarUrl={placeholderAvatarUrl}
          performer={video.performer}
          searching={false}
        />
      )}
      <Popup
        ref={popupRef}
        title={`Buy Video ${video.title}`}
        content={(
          <div>
            <strong>Available high quality Video</strong>
            <h3>
              <NumberFormat
                value={video.token}
                prefix={`Buy ${capitalizeFirstLetter(video.title || '')} For `}
                suffix=" Tokens"
              />
            </h3>
          </div>
          )}
        onOk={onOk}
      />
    </div>
  );
}

VideoDetailPage.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    const { token } = nextCookie(ctx);
    const headers = { Authorization: token || '' };
    const resp = await videoService.userFindVideoById(query.id, headers);
    return {
      data: resp.data
    };
  } catch {
    return redirect('/404', ctx);
  }
};

export default connector(VideoDetailPage);
