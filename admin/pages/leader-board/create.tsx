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

function LeaderBoardCreate() {
  const [submiting, setSubmiting] = useState(false);

  const handleOnFinish = async (data) => {
    try {
      setSubmiting(true);
      await leaderBoardService.create(data);
      message.success('Created success');
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
        <title>Create new leader board</title>
      </Head>
      <BreadcrumbComponent breadcrumbs={[{ title: 'Leader Board', href: '/leader-board' }, { title: 'Create' }]} />
      <Page>
        <LeaderBoardForm
          onFinish={handleOnFinish.bind(this)}
          submiting={submiting}
          leaderboard={null}
        />
      </Page>
    </>
  );
}

export default LeaderBoardCreate;
