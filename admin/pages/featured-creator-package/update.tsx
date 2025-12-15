import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { featuredCreatorService } from "src/services";
import { message } from 'antd';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { IFeaturedCreatorPackage } from 'src/interfaces';
import { FeaturedCreatorPackageForm } from "@components/featured-creator-package";

interface IProps {
  id: any;
}

function FeaturedUpdatePackage({ id }: IProps) {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [featuredPackage, setFeaturedPackage] = useState({} as IFeaturedCreatorPackage);

  const getFeaturedCreatorPackage = async () => {
    try {
      setLoading(true);
      const resp = await featuredCreatorService.findFeaturedPackageById(id);
      setFeaturedPackage(resp.data);
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFeaturedCreatorPackage();
  }, []);

  const handleOnFinish = async (data: any) => {
    try {
      setSubmitting(true);
      await featuredCreatorService.updateFeaturedPackage(id, data);
      message.success('Updated successfully');
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Update featured creator package</title>
      </Head>
      <BreadcrumbComponent
        breadcrumbs={[
          { title: 'Featured Creator Packages', href: '/featured-creator-package' },
          { title: 'Update' }
        ]}
      />
      <Page>
        {loading ? (
          <Loader />
        ) : (
          <FeaturedCreatorPackageForm
            handleOnFinish={handleOnFinish}
            submitting={submitting}
            featuredPackage={featuredPackage}
          />
        )}
      </Page>
    </>
  );
}

FeaturedUpdatePackage.getInitialProps = (ctx) => {
  const { id } = ctx.query;
  return {
    id
  };
};

export default FeaturedUpdatePackage;
