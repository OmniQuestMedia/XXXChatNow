import {
  CrownOutlined,
  SketchOutlined
} from '@ant-design/icons';
import { getPerformerCategories } from '@redux/performer/actions';
import { getCountries } from '@redux/settings/actions';
import {
  Layout,
  Tooltip
} from 'antd';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import style from './header.module.less';
import HeaderSearchInput from './header-search-input';
import LeftHeaderContent from './left-header-content';
// import LeftHeaderContent from './left-header-content';
import RightHeaderContent from './right-header-content';

const mapStates = (state: any) => ({
  logo: state.ui.logo
});

const mapDispatch = {
  dispatchGetCountries: getCountries,
  dispatchGetCategories: getPerformerCategories
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

function Header({
  logo,
  dispatchGetCountries,
  dispatchGetCategories
}: PropsFromRedux) {
  const ref1 = useRef<any>();
  const ref2 = useRef<any>();

  useEffect(() => {
    // TODO - move to somewhere else?
    dispatchGetCountries();

    dispatchGetCategories();

    // TODO - check this function getStudioStats: dispatchGetStudioStats
  }, []);

  return (
    <Layout.Header className={`${style.header}`} id={`${style.layoutHeader}`}>
      <div className="left-container">
        <a className="header-logo" href="/">
          <img
            src={logo || '/xcam-logo-white.png'}
            alt="logo"
          />
        </a>
        <div className="menu-left-header">
          <LeftHeaderContent />
        </div>
      </div>
      <div className={`${style['leaderboard-container']}`}>
        <Link href="/top-members">
          <Tooltip title="Top Members" placement="bottom">
            <CrownOutlined />
          </Tooltip>
        </Link>
        <Link href="/top-models">
          <Tooltip title="Top Models" placement="bottom">
            <SketchOutlined />
          </Tooltip>
        </Link>
      </div>
      <div className={`${style['right-container']}`}>
        <HeaderSearchInput ref={ref1} pathname="/cams" placeholder="Search models" onVisible={() => ref2.current.closeSearch()} />
        <HeaderSearchInput ref={ref2} pathname="/search/models" placeholder="Search VIP models" icon={<CrownOutlined />} onVisible={() => ref1.current.closeSearch()} />
        <RightHeaderContent />
      </div>
    </Layout.Header>
  );
}

export default connector(Header);
