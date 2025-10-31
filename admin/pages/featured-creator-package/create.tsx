import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { featuredCreatorService } from "src/services";
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import React, { useState } from 'react';
import { FeaturedCreatorPackageForm } from "@components/featured-creator-package";

function FeaturedCreatorPackage() {
  const [submitting, setSubmitting] = useState(false);

  const handleOnFinish = async (data: any) => {
    try {
      setSubmitting(true);
      await featuredCreatorService.createFeaturedPackage(data);
      message.success('Created successfully');
      Router.push('/featured-creator-package');
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create featured creator package</title>
      </Head>
      <BreadcrumbComponent
        breadcrumbs={[
          { title: 'Featured Creator Packages', href: '/featured-creator-package' },
          { title: 'Create' }
        ]}
      />
      <Page>
        <FeaturedCreatorPackageForm
          handleOnFinish={handleOnFinish}
          submitting={submitting}
        />
      </Page>
    </>
  );
}

export default FeaturedCreatorPackage;
