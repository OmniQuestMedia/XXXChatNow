import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import FeaturedCreatorBookingForm from '@components/featured-creator-package/booking-form';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import React, { useEffect, useState } from 'react';
import { IFeaturedCreatorPackage } from 'src/interfaces';
import { featuredCreatorService } from 'src/services';

interface IProps {
  id: any;
}

const FeaturedCreatorBookingUpdate = ({ id }: IProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [featuredPackage, setFeaturedPackage] = useState({} as IFeaturedCreatorPackage);

  const getFeaturedCreatorBookingDetail = async () => {
    try {
      setLoading(true);
      const resp = await featuredCreatorService.bookingDetails(id);
      setFeaturedPackage(resp.data);
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFeaturedCreatorBookingDetail();
  }, []);

  const handleOnFinish = async (data: any) => {
    try {
      setSubmitting(true);
      await featuredCreatorService.updateBooking(id, data);
      message.success('Updated successfully');
      Router.push('/featured-creator-package/booking');
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Featured Creator Booking</title>
      </Head>
      <BreadcrumbComponent
        breadcrumbs={[
          { title: 'Featured Creator Package', href: '/featured-creator-package/booking' },
          { title: 'Update Booking Status' }
        ]}
      />
      <Page>
        {loading ? (
          <Loader />
        ) : (
          <FeaturedCreatorBookingForm
            handleOnFinish={handleOnFinish}
            submitting={submitting}
            featuredPackage={featuredPackage}
          />
        )}
      </Page>
    </>
  );
}

FeaturedCreatorBookingUpdate.getInitialProps = (ctx) => {
  const { id } = ctx.query;
  return {
    id
  };
};

export default FeaturedCreatorBookingUpdate;
