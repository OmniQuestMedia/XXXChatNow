import { PerformerSchedules } from '@components/performer/peformer-schedules';
import dynamic from 'next/dynamic';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));

export default function PerformerEventsListingPage() {
  return (
    <div className={style['performer-events-listing-page']}>
      <PageTitle title="Scheduled Premium Live" />
      <PageHeader title="Scheduled Premium Live" />
      <PerformerSchedules />
    </div>
  );
}

PerformerEventsListingPage.authenticate = true;
PerformerEventsListingPage.layout = 'primary';
