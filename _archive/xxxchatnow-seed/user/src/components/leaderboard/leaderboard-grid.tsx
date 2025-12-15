import { LockOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd';
import classNames from 'classnames';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { ILeaderBoard } from 'src/interfaces/leaderboard';

import style from './leaderboard-grid.module.less';

interface IProps {
    leaderboard: ILeaderBoard
}

function LeaderBoardGrid({ leaderboard }: IProps) {
  const currentUser = useSelector((state: any) => state.user.current);
  const placeholderAvatarUrl = useSelector((state: any) => state.ui.placeholderAvatarUrl);
  const Rank = ['top1', 'top2', 'top3'];

  if (!leaderboard) return null;

  return (
    <Row gutter={8}>
      {leaderboard.data.map((data, index) => (
        <Col md={6} xs={12}>
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
                <div className="performer-avatar">
                  <span
                    className={classNames('leaderboard-top', `${Rank[index]}`)}
                  >
                    <span className={style['numerical-order']}>
                      {index + 1}
                    </span>
                  </span>
                  <img
                    className="image-performer"
                    src={data?.user?.avatar || placeholderAvatarUrl || '/no-avatar.png'}
                    alt=""
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
        </Col>
      ))}
    </Row>
  );
}

export default LeaderBoardGrid;
