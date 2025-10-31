import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import {
  Avatar,
  Layout
} from 'antd';
import Link from 'next/link';
import { connect } from 'react-redux';
import { IUser } from 'src/interfaces';

import style from './header.module.less';

type IProps = {
  collapsed?: boolean;
  onCollapseChange?: Function;
  currentUser?: IUser;
}

function Header({ collapsed = false, onCollapseChange = () => { }, currentUser = undefined }: IProps) {
  const rightContent = (
    <ul
      className={style['right-content']}
    >
      <li>
        <Link
          href="/account/settings"
        >
          <a>
            <Avatar src={currentUser.avatar || '/no-avatar.png'} />
          </a>
        </Link>
      </li>
      <li className="logout">
        <Link
          href="/auth/logout"
        >
          <a><LogoutOutlined /></a>
        </Link>
      </li>
    </ul>
  );

  return (
    <Layout.Header className={`${style.header}`} id="layoutHeader">
      <div
        aria-hidden
        className="button"
        onClick={onCollapseChange.bind(this, !collapsed)}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>

      <div className={`${style.rightContainer}`}>{rightContent}</div>
    </Layout.Header>
  );
}

const mapState = (state: any) => ({ currentUser: state.user.current });
export default connect(mapState)(Header);
