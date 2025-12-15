import PopupVideoDetail from '@components/videos/popup-video';
import {
  Col, message, Pagination,
  Row
} from 'antd';
import dynamic from 'next/dynamic';
import {
  useEffect, useRef, useState
} from 'react';
import { getResponseError } from 'src/lib';
import { videoService } from 'src/services';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const Loader = dynamic(() => import('@components/common/base/loader'), { ssr: false });
// const PopupVideoDetail = dynamic(() => import('src/components/videos/popup-video'), { ssr: false });
const PurchasedVideoCard = dynamic(() => import('src/components/videos/purchased-video-card'), { ssr: false });

function PurchasedVideoPage() {
  const popupRef = useRef(null);
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const showError = async (e) => {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const resp = await videoService.purchased({
        limit,
        offset
      });
      setTransactions(resp.data.data);
      setTotal(resp.data.total);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pageChange = async (page) => {
    await setOffset((page - 1) * limit);
    loadData();
  };

  const playVideo = async (videoId: string) => {
    const video = await videoService.userFindVideoById(videoId);
    popupRef && popupRef.current.show(video.data?.video?.url);
    if (video.data?.video?.url) {
      videoService.increaseView(videoId);
    }
    return true;
  };

  return (
    <>
      <div className="main-profile-background">
        <PageTitle title="My Purchased Videos" />
        <PageHeader title="Purchased Videos" />
        <div className="purchased-videos-page pad40">
          {loading && <Loader spinning />}
          {!loading && (transactions.length > 0 ? (
            <Row>
              {transactions.map((transaction) => (
                transaction.targetInfo && (
                  <Col
                    lg={6}
                    md={8}
                    sm={12}
                    xs={24}
                    key={transaction._id}
                    style={{ padding: '0 10px' }}
                  >
                    <PurchasedVideoCard
                      video={transaction.targetInfo}
                      performer={transaction.sellerInfo}
                      onClick={() => playVideo(transaction.targetId)}
                    />
                  </Col>
                )
              ))}
              {total > limit && (
                <Col sm={24} style={{ textAlign: 'center' }}>
                  <Pagination
                    onChange={pageChange.bind(this)}
                    defaultCurrent={1}
                    pageSize={limit}
                    total={total}
                    showSizeChanger={false}
                  />
                </Col>
              )}
            </Row>
          ) : (
            <div className="pad20">
              You have not purchased any videos yet.
            </div>
          ))}
        </div>
      </div>
      <div className="popup-video">
        <PopupVideoDetail ref={popupRef} />
      </div>
    </>
  );
}

PurchasedVideoPage.authenticate = true;
PurchasedVideoPage.layout = 'primary';

export default PurchasedVideoPage;
