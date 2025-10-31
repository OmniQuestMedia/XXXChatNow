import { getResponseError } from '@lib/utils';
import {
  Button,
  Checkbox, message, Table, Tabs
} from 'antd';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { ICountry } from 'src/interfaces';
import { performerService } from 'src/services';

import style from './index.module.less';

interface IProps {
  countries: ICountry[]
}

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));

function PerformerGeoBlockPage({
  countries
}: IProps) {
  const [blockedCountries, setBlockedCountries] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const blockedCountriesRef = useRef(blockedCountries);

  const search = async () => {
    try {
      setIsLoading(true);
      const resp = await performerService.getBlockedList();
      setBlockedCountries(resp.data.countries || []);
      setBlockedUsers(resp.data.usersInfo || []);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error || 'An error occurred, please try again!'));
    } finally {
      setIsLoading(false);
    }
  };

  const blockCountry = async (val) => {
    try {
      await performerService.geoBlock({ countries: val });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error || 'Something went wrong, please try again later');
    } finally {
      setIsBlocking(false);
    }
  };

  useEffect(() => {
    search();
  }, []);

  useEffect(() => {
    if (isBlocking && blockedCountries !== blockedCountriesRef.current) {
      blockCountry(blockedCountries);
    }
  }, [blockedCountries]);

  const handleBlockCountry = (code, event) => {
    setIsBlocking(true);
    if (event.target && event.target.checked) {
      // performerService.geoBlock({ countries: blockedCountries });
      setBlockedCountries([...blockedCountries, code]);
    } else {
      setBlockedCountries(blockedCountries.filter((c) => code !== c));
    }
  };

  const unblockUser = async (userId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await performerService.removeBlockedUser(userId);

      const index = blockedUsers.findIndex((u) => u._id === userId);
      blockedUsers.splice(index, 1);
      setBlockedUsers([
        ...blockedUsers
      ]);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error || 'Something went wrong, please try again later');
    }
  };
  const countriesColumns = [
    {
      title: 'Country',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Coutry Code',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: 'Flag',
      dataIndex: 'flag',
      key: 'flag',
      render: (flag) => <img src={flag} width="50px" alt="" />
    },
    {
      title: '#',
      dataIndex: 'code',
      key: 'check',
      render: (code) => (
        <Checkbox
          disabled={isBlocking}
          defaultChecked={!!(blockedCountries.length > 0 && blockedCountries.find((c) => c === code))}
          onChange={handleBlockCountry.bind(this, code)}
        />
      )
    }
  ];

  const usersColumns = [
    {
      title: '# ',
      dataIndex: '_id',
      key: 'avatar',
      render: (avatar, record) => <img src={record?.avatar || '/default-user-icon.png'} width="50px" alt="" />
    },
    {
      title: 'Name ',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '#',
      dataIndex: '_id',
      key: 'check',
      render: (id) => <div><Button onClick={() => unblockUser(id)}>Unblock</Button></div>
    }
  ];

  return (
    <div className={style['geo-blocking-page']}>
      <PageTitle title="Blocking" />
      <PageHeader title="Blocking" />
      <Tabs defaultActiveKey="geo-block">
        <Tabs.TabPane tab="GEO Blocking" key="geo-block">
          <div>
            {countries && countries.length > 0 && !isLoading ? (
              <Table
                pagination={false}
                dataSource={countries.map((c, index) => ({ ...c, key: `key-country-${index}` }))}
                columns={countriesColumns}
              />
            ) : <p className={style['text-center']}>loading...</p>}
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Black listed users" key="user-block">
          <div>
            {!isLoading ? (
              <Table
                pagination={false}
                dataSource={blockedUsers.map((c, index) => ({ ...c, key: `key-country-${index}` }))}
                columns={usersColumns}
              />
            ) : <p className={style['text-center']}>loading...</p>}
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

PerformerGeoBlockPage.authenticate = true;
PerformerGeoBlockPage.layout = 'primary';

const mapStateToProps = (state) => ({ countries: state.settings.countries });
export default connect(mapStateToProps)(PerformerGeoBlockPage);
