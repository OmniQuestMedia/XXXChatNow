import { IRanking } from 'src/interfaces';

import s from './user-rank.module.less';

interface IProps {
  rank: IRanking;
}

export function UserRankCard({
  rank
}: IProps) {
  return (
    <div className={s['ranking-card']}>
      <span className="ranking-name">
        Your rank:
        {' '}
        <img src={rank.badgingIcon} alt="" />
        <span style={{ color: rank.badgingColor }}>{rank.badgingName}</span>
      </span>
      <span className="ranking-point">
        Your point:
        {' '}
        {rank.points}
        P
      </span>
    </div>
  );
}

export default UserRankCard;
