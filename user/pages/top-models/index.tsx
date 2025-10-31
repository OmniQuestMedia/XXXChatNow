import Loader from '@components/common/base/loader';
import LeaderBoardCarousel from '@components/leaderboard/leaderboard-carousel';
import LeaderBoardGrid from '@components/leaderboard/leaderboard-grid';
import { getResponseError } from '@lib/utils';
import { leaderBoardService } from '@services/leader-board.service';
import { message } from 'antd';
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
      text: 'Best Of The Day'
    },
    {
      value: 'last_week',
      text: 'Best Of The Week'
    },
    {
      value: 'last_month',
      text: 'Best Of The Month'
    },
    {
      value: 'last_year',
      text: 'Best Of The Year'
    }
  ];

  const getLeaderboard = async () => {
    try {
      setLoading(true);
      const resp = await leaderBoardService.search();
      setLeaderboards(resp.data.filter((lb) => lb.type === 'totalEarned'));
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
    <Page className={style['top-models-wrapper']}>
      <PageTitle title="Top Models" />
      <div className={style['top-models-type']}>
        {durationType.map((type) => (
          <a
            className={classNames(style['duration-type'], { [style.active]: duration === type.value })}
            onClick={() => setDuration(type.value)}
            key={type.value}
            aria-hidden
          >
            {type.text}
          </a>
        ))}
      </div>
      <div className={style['top-models-container']}>
        {!loading && <LeaderBoardCarousel leaderboard={leaderboard} />}
        {!loading && <LeaderBoardGrid leaderboard={leaderboard} />}
        {loading && <Loader spinning={loading} />}
      </div>
    </Page>
  );
}
