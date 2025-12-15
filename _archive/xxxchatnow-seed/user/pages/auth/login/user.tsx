import { settingService } from '@services/setting.service';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import style from './login-user.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder));
const UserFormLogin = dynamic(() => import('@components/auth/login/user-login-form'));

function UserLogin() {
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
      <PageTitle title="User sign-in" />
      <div className="form-register-container">
        <UserFormLogin
          googleReCaptchaEnabled={setting.googleReCaptchaEnabled}
          googleReCaptchaSiteKey={setting.googleReCaptchaSiteKey}
        />
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={placeholderLoginUrl} />
    </div>
  );
}

UserLogin.layout = 'auth';
UserLogin.authenticate = false;

export default UserLogin;
