import { message } from "antd";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { crowdfundingService } from "src/services";
import { getResponseError, redirect404 } from '@lib/utils';
import nextCookie from 'next-cookies';
import CrowdfundingForm from '@components/performer/crowdfunding/crowdfunding-form';
import { IPerformerGallery, IResponse } from "src/interfaces";

const PageHeader = dynamic(() => import('@components/common/layout/page-header'));

interface IProps {
  crowdfunding: any;
}

function CreateCrowdfunding ({ crowdfunding }: IProps) {
  console.log('crowdfunding', crowdfunding);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      await crowdfundingService.updateById(crowdfunding._id, values);
      message.success('Updated successfully');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create Crowdfunding" />
      <CrowdfundingForm
        crowdfunding={crowdfunding}
        submitting={submitting}
        onFinish={(value) => onFinish(value)}
      />
    </div>
  );
}

CreateCrowdfunding.authenticate = true;
CreateCrowdfunding.getInitialProps = async (ctx) => {
  try {
    const { id } = ctx.query;

    const { token } = nextCookie(ctx);
    const resp: IResponse<IPerformerGallery> = await crowdfundingService.getById(
      id,
      {
        Authorization: token
      }
    );
  
    return {
      crowdfunding: resp.data || {}
    };
  } catch (e) {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
    return {}
  }
};

export default CreateCrowdfunding;