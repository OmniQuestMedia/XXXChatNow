import { IResponse } from '@services/api-request';
import { Alert, Card, message } from 'antd';
import dynamic from 'next/dynamic';
import { NextRouter, withRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { connect } from 'react-redux';
import { IDataResponse, IPerformer } from 'src/interfaces';
import { capitalizeFirstLetter, getResponseError, redirect } from 'src/lib';
import {
  addPerformerVideos,
  getPerformersVideos
} from 'src/redux/videos/actions';
import { performerService, videoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const Loader = dynamic(() => import('@components/common/base/loader'), { ssr: false });
const VideoSingleCard = dynamic(() => import('@components/videos/video-single-card'), { ssr: false });

interface IProps {
  router: NextRouter;
  performer: IPerformer;
  total: number;
  data: any;
  error: any;
  ids: string[];
  success: boolean;
  searching: boolean;
  getPerformersVideos: Function;
  addPerformerVideos: Function;
  singularTextModel: string;
}

function VideosPage({
  router: { query },
  performer,
  total,
  data,
  error,
  ids,
  success,
  searching,
  singularTextModel = 'Performer',
  getPerformersVideos: dispatchGetPerformersVideos,
  addPerformerVideos: dispatchAddPerformerVideos
}: IProps) {
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);
  const username = performer && performer.username;
  const hasMore = ids.length < total;

  const showError = async (e) => {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  };

  useEffect(() => {
    const performerId = performer ? performer._id : '';
    dispatchGetPerformersVideos({
      ...query,
      limit,
      offset,
      performerId
    });
  }, []);

  const loadMore = async () => {
    try {
      const performerId = performer ? performer._id : '';
      const result = limit + offset;
      const resp: IResponse<IDataResponse<any>> = await videoService.search({
        ...query,
        performerId,
        limit,
        offset: result
      });
      dispatchAddPerformerVideos(resp.data.data);
      setOffset(result);
    } catch (e) {
      showError(e);
    }
  };
  return (
    <>
      <PageTitle title={username ? `${capitalizeFirstLetter(username)}'s Videos` : 'Videos'} />
      {searching && <Loader spinning fullScreen />}
      {error && <Alert type="error" message="Error request" banner />}
      {success && (
        <div className={style['videos-page']}>
          {query.username && !performer && (
            <Alert message={`${singularTextModel} not found.`} banner />
          )}
          <InfiniteScroll
            loadMore={loadMore.bind(this)}
            hasMore={hasMore}
            loader={<p>Loading...</p>}
          >
            <Card
              title={username ? `${capitalizeFirstLetter(username)}'s Videos` : 'Videos'}
              bordered={false}
              hoverable={false}
            >
              {ids.length > 0
                && ids.map((id) => (
                  <Card.Grid hoverable={false}>
                    <VideoSingleCard
                      {...data[id]}
                      key={id}
                      video={data[id]}
                    />
                  </Card.Grid>
                ))}
            </Card>
          </InfiniteScroll>
        </div>
      )}
    </>
  );
}

VideosPage.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    if (query.performer) {
      return {
        performer: JSON.parse(query.performer)
      };
    }

    if (query.username) {
      const resp = await performerService.details(query.username);
      return {
        performer: resp.data
      };
    }

    return {};
  } catch {
    return redirect('/404', ctx);
  }
};

const mapStateToProps = (state) => ({
  ...state.videos,
  singularTextModel: state.ui.singularTextModel
});
const mapDispatchs = { getPerformersVideos, addPerformerVideos };
export default withRouter(connect(mapStateToProps, mapDispatchs)(VideosPage));
