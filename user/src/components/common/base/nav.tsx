import { MenuItemProps, MenuProps } from 'antd';
import MenuItem from 'antd/lib/menu/MenuItem';
import dynamic from 'next/dynamic';
import React, { ReactNode } from 'react';

import s from './nav.module.less';

const Menu = dynamic(() => import('antd/lib/menu'));

export function NavItem({ ...props }: MenuItemProps) {
  return <MenuItem {...props} />;
}

type IProps = {
  children: ReactNode
};

export function NavBar({
  children,
  ...props
}: IProps & React.PropsWithChildren<MenuProps>) {
  return (
    <Menu
      prefixCls="ant-menu"
      mode="horizontal"
      disabledOverflow
      className={s.nav}
      {...props}
    >
      {children}
    </Menu>
  );
}
