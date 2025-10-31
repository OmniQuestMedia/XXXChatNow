import Loader from '@components/common/base/loader';
import { getResponseError } from '@lib/utils';
import { featuredCreatorPackageService } from '@services/featured-creator-package.service';
import {
  Col, Divider, message, Row
} from 'antd';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

import styles from './index.module.less';

const FeaturedCreatorCard = dynamic(() => import('src/components/common/base/featured-creator-card'), { ssr: false });

function FeaturedCreatorPackage() {
  const [packageList, setPackageList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const getFeaturedCreatorPackage = async () => {
    try {
      setLoading(true);
      const resp = await featuredCreatorPackageService.searchFeatureCreatorPackage({
        limit: 100,
        sort: 'desc',
        sortBy: 'createdAt',
        status: 'created'
      });
      setPackageList(resp.data.data);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFeaturedCreatorPackage();
  }, []);

  const handleBuyFeaturedCreatorPackage = async (packageId: string, dates: any) => {
    if (!dates[0] && !dates[1]) {
      return message.error('Please select a start date and end date');
    }

    if (!window.confirm('Are you sure to update featured member?')) {
      return;
    }

    try {
      setRequesting(true);
      await featuredCreatorPackageService.buyFeatureCreatorPackage(packageId, {
        startDate: dates[0],
        endDate: dates[1]
      });
      message.success('Successful featured creator registration! Please wait for the administrator to approve your request');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className={styles['featured-creator-package-page']}>
      <h3 className={styles.note}>Note</h3>
      <Divider />
      <div className={styles['section-package']}>
        <Row>
          {loading ? (
            <Loader />
          ) : packageList.length >= 1 ? (
            packageList.map((featuredPackage) => (
              <Col xs={12} md={8} xl={6} xxl={4} key={featuredPackage._id}>
                <FeaturedCreatorCard
                  featuredPackage={featuredPackage}
                  handleBuyFeaturedCreatorPackage={handleBuyFeaturedCreatorPackage}
                  requesting={requesting}
                />
              </Col>
            ))
          ) : (
            <p style={{ textAlign: 'center' }}>There is no data</p>
          )}
        </Row>
      </div>
    </div>
  );
}

FeaturedCreatorPackage.authenticate = true;
FeaturedCreatorPackage.layout = 'primary';

export default FeaturedCreatorPackage;
