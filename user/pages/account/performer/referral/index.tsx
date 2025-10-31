/* eslint-disable no-unsafe-optional-chaining */

import { InfoCircleOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/layout/page-header';
import TableListReferralEarning from '@components/referral/referral-earning-table';
import ReferralLink from '@components/referral/referral-link';
import ReferralStat from '@components/referral/referral-stat';
import TableListReferralUser from '@components/referral/referral-user-table';
import { IReferralStats } from '@interface/referral';
import { earningService, referralService } from '@services/index';
import {
  Divider,
  Layout, message, Popover, Tabs
} from 'antd';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import style from './index.module.less';

function ModelReferralPage() {
  const ui = useSelector((state: any) => state.ui);
  const settings = useSelector((state: any) => state.settings);
  // Referral link
  const [referralLoading, setReferralLoading] = useState(false);
  const [linkReferral, setLinkReferral] = useState('');
  // Referral stat
  const [stats, setStats] = useState<IReferralStats>();
  // Referral earning
  const [earningLoading, setEarningLoading] = useState(false);
  const [listEarnings, setListEarnings] = useState([]);
  const [filterEarning] = useState({} as any);
  const [paginationEarning, setPaginationEarning] = useState({} as any);
  const [earningSortBy, setEarningSortBy] = useState('createdAt');
  const [earningSort, setEarningSort] = useState('desc');
  const [usersLoading, setUsersLoading] = useState(false);
  const [listUsers, setListUsers] = useState([]);
  const [filterUser] = useState({} as any);
  const [paginationUser, setPaginationUser] = useState({} as any);
  const [usersSortBy, setUsersSortBy] = useState('createdAt');
  const [usersSort, setUsersSort] = useState('desc');

  const [limit] = useState(10);

  const getReferralCode = async () => {
    try {
      setReferralLoading(true);
      const resp = await referralService.getReferralCode();
      setLinkReferral(`${window.location.origin}/signup/member?rel=${resp.data}`);
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred!');
    } finally {
      setReferralLoading(false);
    }
  };

  const getUserStat = async () => {
    try {
      const resp = await earningService.referralStats();
      setStats(resp.data);
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred!');
    }
  };

  const referralTokenEarningSearch = async (page = 1) => {
    try {
      setEarningLoading(true);
      const resp = await earningService.referralSearch({
        ...filterEarning,
        limit,
        offset: (page - 1) * limit,
        sort: earningSort,
        sortBy: earningSortBy
      });
      setListEarnings(resp.data.data);
      setPaginationEarning({ ...paginationEarning, total: resp.data.total, pageSize: limit });
    } catch (e) {
      const err = await e;
      message.error(err);
    } finally {
      setEarningLoading(false);
    }
  };

  const referralUserSearch = async (page = 1) => {
    try {
      setUsersLoading(true);
      const resp = await referralService.search({
        ...filterUser,
        limit,
        offset: (page - 1) * limit,
        sort: usersSort,
        sortBy: usersSortBy
      });
      setListUsers(resp.data.data);
      setPaginationUser({ ...paginationUser, total: resp.data.total, pageSize: limit });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred!');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    getReferralCode();
    getUserStat();
    referralUserSearch();
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(linkReferral);
    message.success('Copied!');
  };

  const handleTableEarningChange = (pagination, filter, sorter) => {
    const pager = { ...paginationEarning };
    pager.current = pagination.current;
    setPaginationEarning(pager);
    setEarningSortBy(sorter.field || 'createdAt');
    // eslint-disable-next-line no-nested-ternary
    setEarningSort(sorter.order ? sorter.order === 'descend' ? 'desc' : 'asc' : 'desc');
    referralTokenEarningSearch(pager.current);
  };

  const handleTableUserChange = (pagination, filter, sorter) => {
    const pager = { ...paginationUser };
    pager.current = pagination.current;
    setPaginationUser(pager);
    setUsersSortBy(sorter.field || 'createdAt');
    // eslint-disable-next-line no-nested-ternary
    setUsersSort(sorter.order ? sorter.order === 'descend' ? 'desc' : 'asc' : 'desc');
    referralUserSearch(pager.current);
  };

  const handlePageChange = async (key: 'earning' | 'referrals' | 'token_earning') => {
    if (key === 'earning') {
      referralTokenEarningSearch();
    }
    if (key === 'referrals') {
      referralUserSearch();
    }
  };

  const content = (
    <div>
      <p>
        Refer a model -
        {' '}
        get
        {' '}
        {settings?.performerReferralCommission || 0}
        % on the model revenue for 1 year
      </p>
      <p>
        Refer a user -
        {' '}
        get
        {' '}
        {settings?.userReferralCommission || 0}
        % on the user spends for 1 year
      </p>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>
          {ui && ui.siteName}
          {' '}
          | Referral
        </title>
      </Head>
      <div className={style['page-referral']}>
        <PageHeader title="Referral" />
        <div className="title">
          <h1>Refer A Friend</h1>
          <div className="info">
            <p>For each friend you refer you&apos;ll get commission</p>
            <Popover content={content}>
              <InfoCircleOutlined />
            </Popover>
          </div>
        </div>
        {settings.referralEnabled && (
          <ReferralLink linkReferral={linkReferral} loading={referralLoading} copyLink={copyLink} />
        )}
        <Divider />
        <ReferralStat stats={stats} />
        <Tabs defaultActiveKey="referrals" onChange={handlePageChange}>
          <Tabs.TabPane tab="Referrals" key="referrals">
            {paginationUser.total ? (
              <TableListReferralUser
                rowKey="_id"
                dataSource={listUsers}
                loading={usersLoading}
                onChange={handleTableUserChange}
                pagination={paginationUser}
              />
            ) : <p className="no-found">No referrals were found</p>}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Earning" key="earning">
            {paginationEarning.total ? (
              <TableListReferralEarning
                rowKey="_id"
                dataSource={listEarnings}
                loading={earningLoading}
                onChange={handleTableEarningChange}
                pagination={paginationEarning}
              />
            ) : <p className="no-found">No revenue was found</p>}
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Layout>
  );
}

ModelReferralPage.authenticate = true;
ModelReferralPage.layout = 'primary';

export default ModelReferralPage;
