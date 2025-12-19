import { BreadcrumbComponent, SearchFilter } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { FeaturedCreatorList } from '@components/featured-creator-package';
import { featuredCreatorService } from "src/services";
import { message } from 'antd';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';

function FeaturedCreatorPackage() {
  const [loading, setLoading] = useState(false);
  const [packageList, setPackageList] = useState([]);
  const [q, setQ] = useState('');

  const getFeaturedCreatorPackage = async () => {
    try {
      setLoading(true);
      const resp = await featuredCreatorService.listFeaturedPackage({
        limit: 100,
        offset: 0,
        q
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

  const searchByName = (k) => {
    setQ(k.q);
    getFeaturedCreatorPackage();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure delete this featured creator package?')) return;

    try {
      setLoading(true);
      await featuredCreatorService.deleteFeaturedPackage(id);
      message.success('Deleted successfully');
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
        <title>Featured Creator Packages</title>
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
          <SearchFilter onSubmit={searchByName} />
          <FeaturedCreatorList
            dataSource={packageList}
            rowKey="_id"
            delete={handleDelete}
          />
        </Page>
      )}
    </>
  );
}

export default FeaturedCreatorPackage;
