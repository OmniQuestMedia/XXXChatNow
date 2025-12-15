import {
  Col, message,
  Pagination, Row
} from 'antd';
import { omit } from 'lodash';
import dynamic from 'next/dynamic';
import React, { PureComponent } from 'react';
import { ISearch } from 'src/interfaces';
import { getResponseError } from 'src/lib';
import { galleryService } from 'src/services';

interface IProps {}
interface IStates extends ISearch {
  data: any[];
  total: number;
  loading: boolean;
}

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const Loader = dynamic(() => import('@components/common/base/loader'), { ssr: false });
const PurchasedGalleryCard = dynamic(() => import('src/components/galleries/purchased-gallery-card'), { ssr: false });

class PurchasedGalleriesPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static layout = 'primary';

  constructor(props) {
    super(props);
    this.state = {
      limit: 12,
      offset: 0,
      sortBy: 'createdAt',
      sort: 'desc',
      data: [],
      total: 0,
      loading: true
    };
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    const query = omit(this.state, ['data', 'total', 'loading']);
    try {
      await this.setState({ loading: true });
      const resp = await galleryService.purchased({ ...query });
      await this.setState({ data: resp.data.data, total: resp.data.total });
    } catch (error) {
      this.showError(error);
    } finally {
      await this.setState({ loading: false });
    }
  }

  async showError(e) {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  }

  async pageChange(page) {
    const { limit } = this.state;
    await this.setState({ offset: (page - 1) * limit });
    this.loadData();
  }

  render() {
    const {
      data, loading, total, limit
    } = this.state;
    return (
      <div className="main-profile-background">
        <PageTitle title="My purchased galleries" />
        <PageHeader title="Purchased Gallery" />
        <div className="purchased-videos-page pad40">
          {loading && <Loader spinning />}
          {!loading && (data?.length ? (
            <Row>
              {data.map((gallery) => gallery.targetInfo && (
              <Col lg={6} md={8} sm={12} xs={24} key={gallery._id} style={{ padding: '0 10px' }}>
                <PurchasedGalleryCard gallery={gallery.targetInfo} />
              </Col>
              ))}
              {total > limit && (
                <Col sm={24} style={{ textAlign: 'center' }}>
                  <Pagination
                    onChange={this.pageChange.bind(this)}
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
              You have not purchased any galleries yet.
            </div>
          ))}
        </div>
      </div>
    );
  }
}
export default PurchasedGalleriesPage;
