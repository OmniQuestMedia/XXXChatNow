import { PerformerScheduledPremiumLive } from '@components/scheduled-premium-live/list-item';
import { redirect } from '@lib/utils';
import { performerService } from '@services/perfomer.service';
import nextCookie from 'next-cookies';
import { IPerformer, IResponse } from 'src/interfaces';

type IProps = {
    performer: IPerformer;
  };

export default function ScheduledPremiumLive({ performer }: IProps) {
  return (
    <PerformerScheduledPremiumLive performer={performer} />
  );
}

ScheduledPremiumLive.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    const { token } = nextCookie(ctx);
    const headers = { Authorization: token || '' };
    const resp: IResponse<IPerformer> = await performerService.details(
      query.username,
      headers
    );
    const performer = resp.data;
    if (performer.isBlocked) {
      redirect('/', ctx);
    }

    return {
      performer
    };
  } catch (e) {
    redirect('/404', ctx);
    return null;
  }
};
