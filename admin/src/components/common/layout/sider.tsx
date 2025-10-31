import {
  Drawer, Layout, MenuTheme, Switch
} from 'antd';
import Link from 'next/link';

import ScrollBar from '../base/scroll-bar';
import { SiderMenu } from './menu';
import style from './sider.module.less';

type ISiderProps = {
  isMobile?: boolean;
  collapsed?: boolean;
  theme?: MenuTheme;
  logo?: string;
  siteName?: string;
  onThemeChange?: Function
  onCollapseChange?: Function;
  menus?: any;
}

function Sider({
  isMobile = false,
  collapsed = false,
  theme = null,
  logo = null,
  siteName = null,
  onThemeChange = () => { },
  onCollapseChange = () => { },
  menus = []
}: ISiderProps) {
  return (
    <Layout.Sider
      width={256}
      breakpoint="lg"
      trigger={null}
      collapsible
      collapsed={collapsed}
      className={style.slider}
    >
      <div className={style.brand}>
        <div className="logo">
          <Link href="/">
            <a>
              {logo ? <img alt="logo" src={logo} /> : <h1>{siteName || 'Admin Panel'}</h1>}
            </a>
          </Link>
        </div>
      </div>

      <div className={style.menuContainer}>
        {isMobile ? (
          <Drawer
            open={!collapsed}
            width={collapsed ? 0 : 300}
            placement="left"
            onClose={() => onCollapseChange(true)}
          >
            <SiderMenu
              menus={menus}
              theme={theme}
              collapsed={false}
            />
          </Drawer>
        )
          : (
            <ScrollBar
              options={{
                // Disabled horizontal scrolling, https://github.com/utatti/perfect-scrollbar#options
                suppressScrollX: true
              }}
            >
              <SiderMenu
                menus={menus}
                theme={theme}
                collapsed={collapsed}
              />
            </ScrollBar>
          )}
      </div>
      {!collapsed && (
        <div className={style.switchTheme}>
          <Switch
            onChange={onThemeChange && onThemeChange.bind(
              this,
              theme === 'dark' ? 'light' : 'dark'
            )}
            defaultChecked={theme === 'dark'}
            checkedChildren="Dark"
            unCheckedChildren="Light"
          />
        </div>
      )}
    </Layout.Sider>
  );
}

export default Sider;
