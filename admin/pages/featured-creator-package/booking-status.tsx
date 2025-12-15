import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { FeaturedCreatorStatusList } from '@components/featured-creator-package';
import { featuredCreatorService } from "src/services";
import { message } from 'antd';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';

function FeaturedCreatorPackage() {
  const [loading, setLoading] = useState(false);
  const [packageList, setPackageList] = useState([]);

  const getFeaturedCreatorPackage = async () => {
    try {
      setLoading(true);
      const resp = await featuredCreatorService.bookingStatusList({
        limit: 100,
        offset: 0
      });
      setPackageList(resp.data.data);
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFeaturedCreatorPackage();
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure to cancel this featured creator package?')) {
      return;
    }

    try {
      setLoading(true);
      await featuredCreatorService.cancelApprovedFeaturedCreator(id);
      message.success('Cancel successfully');
      getFeaturedCreatorPackage();
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Featured Creator Approved</title>
      </Head>
      <BreadcrumbComponent
        breadcrumbs={[
          { title: 'Featured Creator Packages', href: '/featured-creator-package' }
        ]}
      />
      {loading ? (
        <Loader />
      ) : (
        <Page>
          <FeaturedCreatorStatusList
            dataSource={packageList}
            rowKey="_id"
            onCancel={handleCancel}
          />
        </Page>
      )}
    </>
  );
}

export default FeaturedCreatorPackage;
