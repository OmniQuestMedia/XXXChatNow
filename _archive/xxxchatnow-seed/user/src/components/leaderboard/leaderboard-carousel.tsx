import {
  LeftOutlined, LockOutlined,
  RightOutlined
} from '@ant-design/icons';
import { Carousel } from 'antd';
import classNames from 'classnames';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { ILeaderBoard } from 'src/interfaces/leaderboard';

import style from './leaderboard-carousel.module.less';

interface IProps {
    leaderboard: ILeaderBoard;
}

function LeaderBoardCarousel({ leaderboard }: IProps) {
  const currentUser = useSelector((state: any) => state.user.current);
  const placeholderAvatarUrl = useSelector((state: any) => state.ui.placeholderAvatarUrl);
  const Rank = ['top1', 'top2', 'top3'];

  if (!leaderboard) return null;

  return (
    <Carousel
      dots={false}
      arrows
      autoplay
      autoplaySpeed={5000}
      prevArrow={<LeftOutlined />}
      nextArrow={<RightOutlined />}
      className={style['leaderboard-container']}
    >
      {leaderboard?.data.map((data, index) => (
        <div className={style['leaderboard-box']} key={data?.user?._id}>
          {data?.user?.isBlocked && (
            <div className={style['blocked-thumb']}>
              <LockOutlined />
            </div>
          )}
          <Link
            href={{
              pathname: '/profile/[username]',
              query: { performer: JSON.stringify(data?.user) }
            }}
            as={`/profile/${data?.user?.username}`}
          >
            <a aria-hidden onClick={(e) => currentUser?.isPerformer && e.preventDefault()}>
              <div className="leaderboard-item">
                <span
                  className={classNames('leaderboard-top', `${Rank[index]}`)}
                >
                  <span className={style['numerical-order']}>
                    {index + 1}
                  </span>
                </span>
                <img
                  alt=""
                  src={data?.user?.avatar || placeholderAvatarUrl || '/no-avatar.png'}
                />
                <div className={style['per-info']}>
                  <span className={style['per-username']}>{data?.user?.username}</span>
                  <span className={style['per-earning']}>
                    {data?.total}
                    {' '}
                    tokens
                  </span>
                </div>
              </div>
            </a>
          </Link>
        </div>
      ))}
    </Carousel>
  );
}

export default LeaderBoardCarousel;
