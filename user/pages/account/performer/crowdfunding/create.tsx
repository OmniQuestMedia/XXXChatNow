import { message } from "antd";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { crowdfundingService } from "src/services";
import { getResponseError } from '@lib/utils';
import CrowdfundingForm from "@components/performer/crowdfunding/crowdfunding-form";

const PageHeader = dynamic(() => import('@components/common/layout/page-header'));

const CreateCrowdfunding = () => {
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      await crowdfundingService.create(values);
      message.success('Create successful crowdfunding');
      Router.back();
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
        submitting={submitting}
        onFinish={(value) => onFinish(value)}
      />
    </div>
  );
}

export default CreateCrowdfunding;