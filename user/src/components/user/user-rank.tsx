import { IRanking } from 'src/interfaces';

import s from './user-rank.module.less';

interface IProps {
  rank: IRanking;
  username: string;
}

export function UserRank({
  rank,
  username
}: IProps) {
  return (
    <span className={s['ranking-info']}>
      {rank?.badgingIcon
        && <img src={rank?.badgingIcon} alt="" />}
      <span style={{ color: rank?.badgingColor }}>{username}</span>
    </span>
  );
}

export default UserRank;
