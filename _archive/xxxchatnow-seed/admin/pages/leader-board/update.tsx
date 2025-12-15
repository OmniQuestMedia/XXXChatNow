import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import LeaderBoardForm from '@components/leader-board/leader-board-form';
import { getResponseError } from '@lib/utils';
import { leaderBoardService } from '@services/leader-board.service';
import {
  message
} from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { useState } from 'react';
import { ILeaderBoard } from 'src/interfaces';

interface IProps {
  leaderBoard: ILeaderBoard;
}

function LeaderBoardUpdate({ leaderBoard }: IProps) {
  const [submiting, setSubmiting] = useState(false);

  const handleOnFinish = async (data) => {
    try {
      setSubmiting(true);
      await leaderBoardService.updateOne(leaderBoard._id, data);
      message.success('Updated leaderboard success');
      Router.push('/leader-board');
    } catch (err: any) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    } finally {
      setSubmiting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Update Leaderboard</title>
      </Head>
      <BreadcrumbComponent breadcrumbs={[{ title: 'Leader Board', href: '/leader-board' }, { title: 'Update' }]} />
      <Page>
        <LeaderBoardForm
          leaderboard={leaderBoard}
          submiting={submiting}
          onFinish={handleOnFinish.bind(this)}
        />
      </Page>
    </>
  );
}

LeaderBoardUpdate.getInitialProps = async (ctx: any) => {
  const { query } = ctx;
  const resp = await leaderBoardService.findOne(query.id);

  if (!resp.data) {
    Router.push('/404');
  }

  return {
    leaderBoard: resp.data
  };
};

export default LeaderBoardUpdate;
