import { generateUuid } from '@lib/string';
import { settingService } from '@services/setting.service';
import { Divider, Layout } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IUIConfig } from 'src/interfaces';

import style from './footer.module.less';
import GTranslates from './gtranlate';

interface IProps {
  ui: IUIConfig;
}
function Footer({
  ui
}: IProps) {
  const [footerContent, setFooterContent] = useState('');

  const loadSettings = async () => {
    const res = await settingService.valueByKeys(['footerContent']);
    setFooterContent(res.data.footerContent);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const renderMenu = () => {
    const { menus = [] } = ui;

    const data = [];
    if (menus.length) {
      menus.forEach((menu) => {
        const {
          path, isOpenNewTab, internal, title
        } = menu;
        const href = path || '/';
        const key = generateUuid();
        if (internal) {
          data.push(
            <Link key={key} href={href}>
              <a className="mr-8">{title}</a>
            </Link>
          );
        } else {
          data.push(
            <a
              href={href}
              key={key}
              className="mr-8"
              target={isOpenNewTab ? '_blank' : ''}
              rel="noreferrer"
            >
              {menu.title}
            </a>
          );
        }
      });
    }
    return data;
  };

  const { siteName } = ui;
  return (
    <Layout.Footer className={style['main-footer']} id="layoutFooter">
      <div className={style['footer-custom']}>
        <Divider />
        {renderMenu()}
        {footerContent ? (
          <div className="sun-editor-editable" dangerouslySetInnerHTML={{ __html: footerContent }} />
        ) : (
          <p>
            © Copyright
            {' '}
            {siteName || ''}
            {' '}
            {new Date().getFullYear()}
            . All Rights
            Reserved
          </p>
        )}
      </div>
      <GTranslates />
    </Layout.Footer>
  );
}
const mapStateToProps = (state: any) => ({
  ui: { ...state.ui }
});
const mapDispatch = {};
export default connect(mapStateToProps, mapDispatch)(Footer);
