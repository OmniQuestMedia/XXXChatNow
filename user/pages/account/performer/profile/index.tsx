import { beforeAvatarUpload } from '@lib/file';
import {
  Form,
  message, Tabs
} from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { ICountry, IPerformer, IPerformerCategogies } from 'src/interfaces';
import { getResponseError } from 'src/lib/utils';
import {
  setupdatingPerformerProfile,
  updateCurrentPerformer,
  updatePerformerProfile,
  updatePerformerProfileSuccess
} from 'src/redux/performer/actions';
import {
  authService,
  performerService
} from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const ImageUpload = dynamic(() => import('@components/file/image-upload'), { ssr: false });
const PerformerProfile = dynamic(() => import('@components/performer/profile-detail'), { ssr: false });
const ProfileEditForm = dynamic(() => import('@components/performer/profile-edit-form'), { ssr: false });

interface IProps {
  action: string;
  performer: IPerformer;
  categoriesData: IPerformerCategogies[];
  updating: boolean;
  updateSuccess: boolean;
  updateError: any;
  updatePerformerProfile: Function;
  updateCurrentPerformer: Function;
  updatePerformerProfileSuccess: Function;
  setupdatingPerformerProfile: Function;
  countries: ICountry[];
}

function PerformerProfilePage({
  updateSuccess,
  updateError,
  performer,
  updatePerformerProfile: dispatchupDatePerformerProfile,
  updatePerformerProfileSuccess: dispatchUpdatePerformerProfileSuccess,
  setupdatingPerformerProfile: dispatchSetUpdating,
  action,
  categoriesData,
  updating,
  countries
}: IProps) {
  const uploadHeaders = {
    authorization: authService.getToken()
  };
  const preUpdateSuccess = useRef(updateSuccess);
  const preUpdateError = useRef(updateError);

  useEffect(() => {
    if (preUpdateSuccess.current !== updateSuccess && updateSuccess) {
      message.success('Update Profile Success.');
    }

    if (preUpdateError.current !== updateError && updateError) {
      message.error(getResponseError(updateError));
    }
    preUpdateSuccess.current = updateSuccess;
  }, [updateSuccess, updateError]);

  const onTabsChange = (key: string) => {
    Router.push(
      {
        pathname: '/account/performer/profile',
        query: { action: key }
      },
      `/account/performer/profile?action=${key}`,
      { shallow: false, scroll: false }
    );
  };

  const onFinish = (data: any) => {
    dispatchupDatePerformerProfile({ ...performer, ...data });
  };

  const onUploadedAvatar = (data: any) => {
    dispatchSetUpdating();
    dispatchUpdatePerformerProfileSuccess({
      ...performer,
      avatar: data.response.data.url
    });
  };

  return (
    <div className={style['performer-profile-page']}>
      <PageTitle title="My Profile" />
      <PageHeader title="My Profile" />
      <Tabs
        activeKey={action || 'profile-image'}
        style={{ padding: '0 24px' }}
        size="large"
        onChange={onTabsChange.bind(this)}
      >
        <Tabs.TabPane tab="Profile Image" key="profile-image">
          <Form.Item label="Profile Image">
            <ImageUpload
              options={{ fieldName: 'avatar' }}
              imageUrl={performer?.avatar}
              uploadUrl={performerService.getAvatarUploadUrl()}
              headers={uploadHeaders}
              beforeUpload={beforeAvatarUpload}
              onUploaded={onUploadedAvatar.bind(this)}
            />
            <div>Image size limit: 2MB. Accepted formats: JPEG, JPG and PNG</div>
          </Form.Item>
        </Tabs.TabPane>
        <Tabs.TabPane tab="My Profile" key="profile">
          <PerformerProfile performer={performer} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Edit Profile" key="edit-profile">
          <ProfileEditForm
            {...performer}
            categoriesData={categoriesData}
            countries={countries}
            onFinish={onFinish.bind(this)}
            loading={updating}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

PerformerProfilePage.authenticate = true;
PerformerProfilePage.layout = 'primary';
PerformerProfilePage.getInitialProps = (ctx) => {
  const { query } = ctx;
  return {
    action: query.action
  };
};

const mapStateToProps = (state) => ({
  performer: state.performer.current,
  updating: state.performer.updating,
  updateSuccess: state.performer.updateSuccess,
  updateError: state.performer.updateError,
  categoriesData: state.performer.categories.data,
  countries: state.settings.countries
});
const mapDispatchs = {
  updatePerformerProfile,
  updateCurrentPerformer,
  updatePerformerProfileSuccess,
  setupdatingPerformerProfile
};
export default connect(mapStateToProps, mapDispatchs)(PerformerProfilePage);
