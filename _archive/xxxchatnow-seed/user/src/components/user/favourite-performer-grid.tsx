import { CalendarOutlined, HeartFilled } from '@ant-design/icons';
import {
  FemaleSignIcon,
  MaleSignIcon,
  TransgenderIcon
} from '@components/common/base/icons';
import { Card, Pagination, Popconfirm } from 'antd';
import Link from 'next/link';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { GENDER, ICountry, IFavourite } from 'src/interfaces';
import { getAge } from 'src/lib';

import style from './favourite-performer-grid.module.less';

interface IProps {
  data: IFavourite[];
  total?: number;
  success?: boolean;
  searching: boolean;
  title?: string | string[];
  countries: ICountry[];
  dislike: Function;
  setFilter: Function;
  query: {
    offset: number,
    limit: number
  }
}

const mapStateToProps = (state) => ({ placeholderAvatarUrl: state.ui.placeholderAvatarUrl });

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

const renderGender = (gender: GENDER) => {
  switch (gender) {
    case 'male':
      return <MaleSignIcon color="#666" />;
    case 'female':
      return <FemaleSignIcon color="#666" />;
    case 'transgender':
      return <TransgenderIcon color="#666" />;
    default:
      return null;
  }
};

function FavouritePerformerGrid({
  data,
  success = false,
  searching,
  title = '',
  dislike,
  setFilter,
  countries,
  total = 0,
  query: { limit, offset },
  placeholderAvatarUrl = '/no-avatar.png'
}: IProps & PropsFromRedux) {
  const renderFlag = (country: string) => {
    const pCountry = countries.find((c) => c.code === country);
    return pCountry && <span className={style['performer-flag']}><img alt="" src={pCountry.flag} /></span>;
  };

  return (
    <Card
      className={style['favorite-performer-grid']}
      title={title}
      bordered={false}
      hoverable={false}
      actions={[
        total > 0 && total > limit && (
          <Pagination
            disabled={searching}
            current={Math.round(offset / limit) + 1}
            pageSize={limit}
            total={total}
            size="small"
            onChange={(page) => setFilter('offset', (page - 1) * limit)}
            showSizeChanger={false}
          />
        )
      ]}
    >
      {success && data.length > 0 ? (
        data.map((favourite) => (
          <Card.Grid
            className={style['performer-box']}
            key={favourite.favoriteId}
            hoverable={false}
          >
            <Link
              href={{
                pathname: '/stream',
                query: { performer: JSON.stringify(favourite.performer) }
              }}
              as={`/profile/${favourite.performer?.username}`}
            >
              <a className={style['performer-avatar']}>
                <img src={favourite.performer?.avatar || placeholderAvatarUrl} alt="" />
              </a>
            </Link>
            <div className={style['performer-title']}>
              <div className={style['performer-name']}>
                <span>{favourite.performer?.username || 'N/A'}</span>
              </div>
              {favourite.performer?.dateOfBirth && (
                <span>
                  (
                  {getAge(favourite.performer?.dateOfBirth)}
                  )
                </span>
              )}
              {renderGender(favourite.performer?.gender)}
              {renderFlag(favourite.performer?.country)}
            </div>
            <Link href={{
              pathname: '/scheduled-premium-live',
              query: { username: favourite.performer?.username }
            }}
            >
              <CalendarOutlined className={style.calander} />
            </Link>
            <Popconfirm
              placement="bottom"
              title="Are you sure to dislike this performer!"
              onConfirm={() => dislike(favourite.performer)}
              okText="Yes"
              cancelText="No"
            >
              <HeartFilled className={style.icon} />
            </Popconfirm>
          </Card.Grid>
        ))) : (<p>No favorites</p>
      )}
    </Card>
  );
}

export default connector(FavouritePerformerGrid);
