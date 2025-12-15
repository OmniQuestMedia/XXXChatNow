// import '../auth/index.less';

import { settingService } from '@services/setting.service';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import style from './studio.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder), { ssr: false });
const StudioFormLogin = dynamic(() => import('@components/studio/studio-login-form'), { ssr: false });

function StudioLogin() {
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

  return (
    <div className={style['register-page']}>
      <PageTitle title="Studio Sign-in" />
      <div className="form-register-container">
        <StudioFormLogin
          googleReCaptchaEnabled={setting.googleReCaptchaEnabled}
          googleReCaptchaSiteKey={setting.googleReCaptchaSiteKey}
        />
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={placeholderLoginUrl} />
    </div>
  );
}

StudioLogin.layout = 'auth';
StudioLogin.authenticate = false;

export default StudioLogin;
