import { settingService } from '@services/setting.service';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';

import style from './login-performer.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder));
const PerformerLoginForm = dynamic(() => import('@components/auth/login/performer-login-form'));

const mapStates = (state: any) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function PerformerLogin({
  singularTextModel
}: PropsFromRedux) {
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

  const pageTitle = `${singularTextModel} Sign-in`;

  return (
    <div className={style['register-page']} style={{}}>
      <PageTitle title={pageTitle} />
      <div className="form-register-container">
        <PerformerLoginForm
          googleReCaptchaEnabled={setting.googleReCaptchaEnabled}
          googleReCaptchaSiteKey={setting.googleReCaptchaSiteKey}
        />
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={placeholderLoginUrl} />
    </div>
  );
}

PerformerLogin.layout = 'auth';
PerformerLogin.authenticate = false;

export default connector(PerformerLogin);
