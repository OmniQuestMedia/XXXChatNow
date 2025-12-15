import { IReferralStats } from '@interface/referral';
import { Statistic } from 'antd';

import style from './referral-stat.module.less';

interface IProps {
  stats: IReferralStats
}

function ReferralStat({ stats }: IProps) {
  return (
    <div className={style['starts-referral']}>
      {/* <Statistic
        title="Referral Earnings"
        // prefix="€"
        prefix={<img alt="coin" src="/token.png" width="20px" />}
        value={stats?.totalNetPrice || 0}
        precision={2}
      /> */}
      <Statistic
        title="Referral Token Earnings"
        prefix={<img alt="coin" src="/token.png" width="20px" />}
        value={stats?.totalTokenNetPrice || 0}
        precision={2}
      />
      <Statistic
        title="Total Referrals"
        value={stats?.totalRegisters || 0}
      />
      <Statistic
        title="Total Sales"
        value={stats?.totalSales || 0}
      />
    </div>
  );
}

export default ReferralStat;
