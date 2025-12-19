import './recaptcha.module.less';

import Router from 'next/router';
import { forwardRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface IProps {
  googleReCaptchaEnabled: boolean;
  googleReCaptchaSiteKey: string;
  error: string;
}

const GoogleReCaptcha = forwardRef<any, IProps>((props: IProps, ref) => {
  const {
    googleReCaptchaEnabled, googleReCaptchaSiteKey, error
  } = props;

  const onRouteChangeStart = () => {
    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }
  };

  useEffect(() => {
    Router.events.on('routeChangeStart', onRouteChangeStart);

    return () => {
      Router.events.off('routeChangeStart', onRouteChangeStart);
    };
  }, []);

  if (!googleReCaptchaEnabled) return null;

  return (
    <div className="recaptcha-box">
      <ReCAPTCHA
        ref={ref}
          // size={size}
          // badge="inline"
        sitekey={googleReCaptchaSiteKey}
      />
      {error && (
        <p className="recaptcha-error-message">
          {error || 'Please verify that you are not a robot.'}
        </p>
      )}
    </div>
  );
});
export default GoogleReCaptcha;
