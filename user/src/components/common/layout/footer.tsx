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

  const renderMenuItem = (menu: any) => {
    const {
      path, isOpenNewTab, internal, title, _id
    } = menu;
    const href = path || '/';
    const key = _id || generateUuid();
    
    if (internal) {
      return (
        <Link key={key} href={href}>
          <a className="mr-8">{title}</a>
        </Link>
      );
    }
    return (
      <a
        href={href}
        key={key}
        className="mr-8"
        target={isOpenNewTab ? '_blank' : ''}
        rel="noreferrer"
      >
        {title}
      </a>
    );
  };

  const renderMenu = () => {
    const { menus = [] } = ui;

    // Filter menus for footer section
    const footerMenus = menus.filter((menu: any) => menu.section === 'footer');

    const data = [];
    if (footerMenus.length) {
      footerMenus.forEach((menu: any) => {
        data.push(renderMenuItem(menu));
        
        // Render children if they exist (hierarchical support)
        if (menu.children && menu.children.length > 0) {
          menu.children.forEach((childMenu: any) => {
            data.push(renderMenuItem(childMenu));
          });
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
