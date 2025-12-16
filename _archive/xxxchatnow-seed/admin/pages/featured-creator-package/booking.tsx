import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { FeaturedCreatorBookingList } from '@components/featured-creator-package';
import { featuredCreatorService } from "src/services";
import { message } from 'antd';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';

export default function FeaturedCreatorBooking() {
  const [loading, setLoading] = useState(false);
  const [packageList, setPackageList] = useState([]);

  const getFeaturedCreatorBooking = async () => {
    try {
      setLoading(true);
      const resp = await featuredCreatorService.listBooking({
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
    getFeaturedCreatorBooking();
  }, []);

  return (
    <>
      <Head>
        <title>Featured Creator Booking</title>
      </Head>
      <BreadcrumbComponent
        breadcrumbs={[
          { title: 'Featured Creator Booking', href: '/featured-creator-package/booking' }
        ]}
      />
      {loading ? (
        <Loader />
      ) : (
        <Page>
          <FeaturedCreatorBookingList
            dataSource={packageList}
            rowKey="_id"
          />
        </Page>
      )}
    </>
  );
}