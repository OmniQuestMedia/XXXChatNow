import { settingService } from '@services/setting.service';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';

import style from './user-register.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder));
const UserRegisterForm = dynamic(() => import('@components/auth/register/user-register-form'), { ssr: false });

const mapStates = (state) => ({
  loggedIn: state.auth.loggedIn,
  singularTextModel: state.settings.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface IProps {
  rel: string;
}

function UserRegisterPage({
  loggedIn,
  rel
}: IProps & PropsFromRedux) {
  const router = useRouter();
  const [setting, setSetting] = useState<Record<string, any>>({});
  const placeholderLoginUrl = useSelector((state: any) => state.ui.placeholderLoginUrl);

  const getSettingKeys = async () => {
    const metaSettings = await settingService.valueByKeys([
      'googleReCaptchaEnabled',
      'googleReCaptchaSiteKey',
      'placeholderLoginUrl'
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
      <PageTitle title="Member Signup" />
      <div className="form-register-container">
        <UserRegisterForm
          googleReCaptchaEnabled={setting.googleReCaptchaEnabled}
          googleReCaptchaSiteKey={setting.googleReCaptchaSiteKey}
          rel={rel}
        />
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={placeholderLoginUrl} />
    </div>
  );
}

UserRegisterPage.getInitialProps = async (ctx) => ({
  rel: ctx?.query?.rel
});
export default connector(UserRegisterPage);
