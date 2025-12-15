import Loader from '@components/common/base/loader';
import LeaderBoardCard from '@components/leaderboard/leaderboard-card';
import { getResponseError } from '@lib/utils';
import { leaderBoardService } from '@services/leader-board.service';
import {
  Button, message
} from 'antd';
import classNames from 'classnames';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { ILeaderBoard } from 'src/interfaces/leaderboard';

import style from './index.module.less';

const Page = dynamic(() => import('@components/common/layout/page'));
const PageTitle = dynamic(() => import('@components/common/page-title'));

export default function TopMembers() {
  const [leaderboards, setLeaderboards] = useState<ILeaderBoard[]>([]);
  const [duration, setDuration] = useState('last_day');
  const [loading, setLoading] = useState(false);

  const durationType = [
    {
      value: 'last_day',
      text: 'Day'
    },
    {
      value: 'last_week',
      text: 'Week'
    },
    {
      value: 'last_month',
      text: 'Month'
    },
    {
      value: 'last_year',
      text: 'Year'
    }
  ];

  const getLeaderboard = async () => {
    try {
      setLoading(true);
      const resp = await leaderBoardService.search();
      setLeaderboards(resp.data.filter((lb) => lb.type === 'totalSpent'));
    } catch (e) {
      const err = getResponseError(e);
      message.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLeaderboard();
  }, []);

  const leaderboard = useMemo(() => leaderboards.find((l) => l.duration === duration), [leaderboards, duration]);

  return (
    <Page className={style['top-members-container']}>
      <PageTitle title="Top Members" />
      <div className={style['top-members-title']}>
        <img src="/crown-member.png" alt="" />
        <div>
          <h1>Top Members</h1>
          <span>Begin your journey to the top of the Top Members list by first becoming the King of the Room as many times as you can.</span>
        </div>
      </div>
      <div className={style['top-members-wrapper']}>
        {durationType.map((d) => (
          <Button
            className={classNames(style['duration-btn'], { [style.active]: duration === d.value })}
            onClick={() => setDuration(d.value)}
            key={d.value}
          >
            {d.text}
          </Button>
        ))}
      </div>
      {!loading && <LeaderBoardCard leaderboard={leaderboard} />}
      {loading && <Loader spinning={loading} />}
    </Page>
  );
}
