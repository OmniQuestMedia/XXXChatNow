// import '../auth/index.less';

import { settingService } from '@services/setting.service';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';

import style from './studio.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const StudioRegisterForm = dynamic(() => import('@components/auth/register/studio-register-form'), { ssr: false });
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder), { ssr: false });

const mapStates = (state) => ({
  loggedIn: state.auth.loggedIn
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function RegisterStudioPage({
  loggedIn
}: PropsFromRedux) {
  const router = useRouter();
  const [setting, setSetting] = useState<Record<string, any>>({});

  const placeholderLoginUrl = useSelector((state: any) => state.ui.placeholderLoginUrl);

  const getSettingKeys = async () => {
    const metaSettings = await settingService.valueByKeys([
      'googleReCaptchaEnabled',
      'googleReCaptchaSiteKey'
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

  return (
    <div className={style['register-page']}>
      <PageTitle title="Studio register" />
      <div className="form-register-container">
        <StudioRegisterForm
          googleReCaptchaEnabled={setting.googleReCaptchaEnabled}
          googleReCaptchaSiteKey={setting.googleReCaptchaSiteKey}
        />
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={placeholderLoginUrl} />
    </div>
  );
}

RegisterStudioPage.layout = 'auth';
RegisterStudioPage.authenticate = false;

export default connector(RegisterStudioPage);
