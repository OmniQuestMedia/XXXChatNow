import { NavBar, NavItem } from '@components/common/base/nav';
import { currentUserSelector } from '@redux/selectors';
// import { Dropdown, Menu } from 'antd';
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
  performerCategories: state.performer.categories
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
  streamSettings
}: PropsFromRedux) {
  const [selectedKey, setSelectedKey] = useState('');
  const path = streamSettings[SETTING_KEYS.OPTION_FOR_GROUP] === 'webrtc' ? 'webrtc/' : '';
  // const { data: categories } = performerCategories;

  // const categoryItems = categories.map((category) => ({
  //   label: (
  //     <Link
  //       href={{
  //         pathname: '/search/models',
  //         query: {
  //           category: category.slug
  //         }
  //       }}
  //       as={`/category/${category.slug}`}
  //     >
  //       <a>{category.name}</a>
  //     </Link>
  //   ),
  //   key: category._id
  // }));

  // const CategorySubMenu = (
  //   <Menu
  //     mode="inline"
  //     style={{ display: 'flex', flexWrap: 'wrap' }}
  //     items={categoryItems}
  //     onClick={() => setSelectedKey('')}
  //   />
  // );

  return (
    <NavBar activeKey={selectedKey}>
      <NavItem
        key="home"
        // className="hidden-sm"
        onClick={() => {
          setSelectedKey('home');
        }}
        aria-hidden="true"
      >
        <Link href="/">
          <a>
            <span className="hidden-lg">Home</span>
            {/* <HomeOutlined className="visible-lg" /> */}
          </a>
        </Link>
      </NavItem>
      {/* {categories.length > 0 && (
        <Dropdown
          overlay={CategorySubMenu}
          overlayClassName={style['cate-sub-menu-overlay']}
          trigger={['click', 'hover']}
        >
          <NavItem hidden={loggedIn && currentUser && currentUser.isPerformer}>
            <span className="hidden-lg">Categories</span>
          </NavItem>
        </Dropdown>
      )} */}
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
