import { postService } from '@services/post.service';
import { settingService } from '@services/setting.service';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';

import style from './model-register.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder));
const ModelRegisterForm = dynamic(() => import('@components/auth/register/model-register-form'));

interface IProps {
  settings: any;
  linkToAgreementContent: string;
  rel: string;
}

const mapStates = (state) => ({
  loggedIn: state.auth.loggedIn,
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function PerformerRegisterPage({
  loggedIn,
  settings,
  linkToAgreementContent,
  rel
}: PropsFromRedux & IProps) {
  const router = useRouter();
  const [setting, setSetting] = useState<Record<string, any>>({});

  const placeholderLoginUrl = useSelector((state: any) => state.ui.placeholderLoginUrl);

  const getSettingKeys = async () => {
    const metaSettings = await settingService.valueByKeys([
      'googleReCaptchaEnabled',
      'googleReCaptchaSiteKey',
      'placeholderLoginUrl',
      'singularTextModel'
    ]);
    setSetting(metaSettings.data);
  };

  useEffect(() => {
    getSettingKeys();
  }, []);

  useEffect(() => {
    if (loggedIn) {
      message.info('Logged in!');
      router.push('/');
    }
  }, [loggedIn]);

  const pageTitle = `${setting.singularTextModel} Signup`;
  return (
    <div className={style['register-page']}>
      <PageTitle title={pageTitle} />
      <div className="form-register-container">
        <ModelRegisterForm
          googleReCaptchaEnabled={settings?.googleReCaptchaEnabled}
          googleReCaptchaSiteKey={settings?.googleReCaptchaSiteKey}
          linkToAgreementContent={linkToAgreementContent}
          rel={rel}
        />
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={placeholderLoginUrl} />
    </div>
  );
}
PerformerRegisterPage.getInitialProps = async (ctx) => {
  try {
    const metaSettings = await settingService.valueByKeys([
      'googleReCaptchaEnabled',
      'googleReCaptchaSiteKey',
      'placeholderLoginUrl',
      'providerAgreementContent'
    ]);

    let linkToAgreementContent = '';
    if (metaSettings.data.providerAgreementContent) {
      const resp = await postService.findById(metaSettings.data.providerAgreementContent);
      linkToAgreementContent = resp.data.slug;
    }

    return {
      settings: metaSettings.data,
      linkToAgreementContent,
      rel: ctx?.query?.rel || ''
    };
  } catch (e) {
    return {
      settings: null,
      linkToAgreementContent: '',
      rel: ctx?.query?.rel || ''
    };
  }
};

export default connector(PerformerRegisterPage);
