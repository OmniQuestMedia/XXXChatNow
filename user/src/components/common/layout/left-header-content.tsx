import { NavBar, NavItem } from '@components/common/base/nav';
import { currentUserSelector } from '@redux/selectors';
import { Menu, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { SETTING_KEYS } from 'src/constants';

// import style from './left-header-content.module.less';

const mapStateToProps = (state) => ({
  loggedIn: state.auth.loggedIn,
  currentUser: currentUserSelector(state),
  pluralTextModel: state.ui.pluralTextModel,
  streamSettings: state.streaming.settings,
  performerCategories: state.performer.categories,
  menus: state.ui.menus || []
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

function LeftHeaderContent({
  loggedIn,
  currentUser,
  pluralTextModel = 'Performers',
  // performerCategories = {
  //   total: 0,
  //   data: []
  // },
  streamSettings,
  menus = []
}: PropsFromRedux) {
  const [selectedKey, setSelectedKey] = useState('');
  const path = streamSettings[SETTING_KEYS.OPTION_FOR_GROUP] === 'webrtc' ? 'webrtc/' : '';
  
  // Filter menus for header section
  const headerMenus = menus.filter((menu: any) => menu.section === 'header');

  const renderMenuItem = (menu: any, isChild = false) => {
    const {
      path: menuPath, isOpenNewTab, internal, title, _id, children
    } = menu;
    const href = menuPath || '/';
    const key = _id || title;

    // If menu has children, render as dropdown
    if (children && children.length > 0) {
      const subMenuItems = children.map((child: any) => ({
        key: child._id || child.title,
        label: child.internal ? (
          <Link href={child.path}>
            <a>{child.title}</a>
          </Link>
        ) : (
          <a
            href={child.path}
            target={child.isOpenNewTab ? '_blank' : ''}
            rel="noreferrer"
          >
            {child.title}
          </a>
        )
      }));

      const subMenu = (
        <Menu items={subMenuItems} onClick={() => setSelectedKey('')} />
      );

      return (
        <Dropdown key={key} overlay={subMenu} trigger={['click', 'hover']}>
          <NavItem
            onClick={() => setSelectedKey(key)}
            aria-hidden="true"
          >
            <span className="hidden-lg">
              {title}
              {' '}
              <DownOutlined />
            </span>
          </NavItem>
        </Dropdown>
      );
    }

    // Single menu item without children
    return (
      <NavItem
        key={key}
        onClick={() => setSelectedKey(key)}
        aria-hidden="true"
      >
        {internal ? (
          <Link href={href}>
            <a>
              <span className="hidden-lg">{title}</span>
            </a>
          </Link>
        ) : (
          <a
            href={href}
            target={isOpenNewTab ? '_blank' : ''}
            rel="noreferrer"
          >
            <span className="hidden-lg">{title}</span>
          </a>
        )}
      </NavItem>
    );
  };

  return (
    <NavBar activeKey={selectedKey}>
      {/* Database-driven menus */}
      {headerMenus.map((menu: any) => renderMenuItem(menu))}
      
      {/* Legacy hardcoded menus - keeping for backward compatibility */}
      <NavItem
        key="allModel"
        // className="hidden-sm"
        onClick={() => {
          setSelectedKey('allModel');
        }}
        aria-hidden="true"
        hidden={loggedIn && currentUser && currentUser.isPerformer}
      >
        <Link href="/cams" as="/all-models">
          <a>
            <span className="hidden-lg">{`All ${pluralTextModel}`}</span>
            {/* <StarOutlined className="visible-lg" /> */}
          </a>
        </Link>
      </NavItem>
      <NavItem
        key="vipModel"
        // className="hidden-sm"
        onClick={() => {
          setSelectedKey('vipModel');
        }}
        aria-hidden="true"
        hidden={loggedIn && currentUser && currentUser.isPerformer}
      >
        <Link href="/search/models" as="/vip-models">
          <a>
            <span className="hidden-lg">{`Vip ${pluralTextModel}`}</span>
            {/* <StarOutlined className="visible-lg" /> */}
          </a>
        </Link>
      </NavItem>
      {loggedIn && currentUser && currentUser.isPerformer && currentUser.verified && (
        <>
          <NavItem
            key="live"
            // className="hidden-sm"
            onClick={() => {
              setSelectedKey('live');
            }}
            aria-hidden="true"
          >
            <Link href={{ pathname: '/live' }} as={`/live/${currentUser.username}`}>
              <a>
                <span className="hidden-lg">Live Room</span>
                {/* <StreamIcon className="visible-lg" /> */}
              </a>
            </Link>
          </NavItem>
          <NavItem
            key="groupchat"
            // className="hidden-sm"
            onClick={() => {
              setSelectedKey('groupchat');
            }}
            aria-hidden="true"
          >
            <Link href={`/live/${path}groupchat`}>
              <a>
                <span className="hidden-lg">Group Chat</span>
                {/* <UsergroupAddOutlined className="visible-lg" /> */}
              </a>
            </Link>
          </NavItem>
        </>
      )}
    </NavBar>
  );
}

export default connector(LeftHeaderContent);
