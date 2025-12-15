import { capitalizeFirstLetter } from '@lib/string';
import { Card } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { ILeaderBoard } from 'src/interfaces/leaderboard';

import s from './leaderboard-card.module.less';

interface IProps {
  leaderboard: ILeaderBoard
}

const Rank = ['top1', 'top2', 'top3'];

// eslint-disable-next-line react/function-component-definition
const LeaderBoardCard: React.FC<IProps> = ({ leaderboard }: IProps) => {
  if (!leaderboard) return null;
  return (
    <Card className={s['leaderboard-card']} bordered={false}>
      {leaderboard.data.map((res, index) => (
        <div className={classNames('leaderboard-information', { odd: index % 2 === 0 })} key={res.user.username}>
          <span className="left-content">
            <span
              className={classNames('leaderboard-top', `${Rank[index]}`)}
            >
              <span className="numerical-order">
                {index + 1}
              </span>
            </span>
            <span>{capitalizeFirstLetter(res.user.username)}</span>
          </span>
          <span>
            {res.total.toFixed(2)}
            {' '}
            tokens
          </span>
        </div>
      ))}
    </Card>
  );
};

export default LeaderBoardCard;
