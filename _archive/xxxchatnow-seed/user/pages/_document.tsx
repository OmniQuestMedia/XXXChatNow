import { settingService } from '@services/setting.service';
import parse from 'html-react-parser';
import Document, {
  Head, Html, Main, NextScript
} from 'next/document';

class CustomDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const resp = await settingService.all();
    const settings = resp.data;
    return {
      ...initialProps,
      settings
    };
  }

  render() {
    const { settings } = this.props as any;
    return (
      <Html>
        <Head>
          <link rel="icon" href={settings?.favicon} sizes="64x64" />
          <script src="https://api.lovense-api.com/cam-extension/static/js-sdk/broadcast.js" />
          <link href="https://unpkg.com/video.js/dist/video-js.min.css" rel="stylesheet" />
          {settings.headerScript && parse(settings.headerScript)}
          <script src="/lib/winwheel.min.js" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js" />
        </Head>
        <body>
          <Main />
          <NextScript />

          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var darkMode = localStorage.getItem('darkmode');
                    if (darkMode === null || darkMode === 'true') {
                      document.body.classList.add('darkmode');
                      if (darkMode === null) {
                        localStorage.setItem('darkmode', 'true');
                      }
                    }
                  } catch (e) {}
                })();
              `
            }}
          />

          {/* extra script */}
          {settings?.afterBodyScript && (
            // eslint-disable-next-line react/no-danger
            <div dangerouslySetInnerHTML={{ __html: settings.afterBodyScript }} />
          )}
        </body>
      </Html>
    );
  }
}

export default CustomDocument;
