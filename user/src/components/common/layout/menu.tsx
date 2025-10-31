import { Menu } from 'antd';
import Link from 'next/link';
import { NextRouter, useRouter, withRouter } from 'next/router';
import { useEffect, useState } from 'react';

type IProps = {
  theme?: string;
  isMobile?: boolean;
  menus?: any;
  collapsed?: boolean;
  router: NextRouter;
  totalUnreadMessage?: number;
  onClick?: () => void;
}

function SiderMenu({
  theme = 'light',
  // isMobile = false,
  menus = [],
  collapsed = false,
  totalUnreadMessage = 0,
  onClick = () => {}
}: IProps) {
  const [openKeys, setOpenKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(['dashboard']);
  const router = useRouter();

  const onOpenChange = (openKeys2) => {
    const rootSubmenuKeys = menus
      .filter((_) => !_.menuParentId)
      .map((_) => _.id);

    const latestOpenKey = openKeys2.find(
      (key) => openKeys2.indexOf(key) === -1
    );

    let newOpenKeys = openKeys2;
    if (rootSubmenuKeys.indexOf(latestOpenKey) !== -1) {
      newOpenKeys = latestOpenKey ? [latestOpenKey] : [];
    }

    setOpenKeys(newOpenKeys);
  };

  const generateMenus = (data) => data.map((item) => {
    if (item.children) {
      return (
        <Menu.SubMenu
          icon={item.icon}
          key={item._id}
          title={<span>{item.name}</span>}
        >
          {generateMenus(item.children)}
        </Menu.SubMenu>
      );
    }
    return (
      <Menu.Item key={item.id} icon={item.icon}>
        <Link href={item.route} as={item.as || item.route}>
          <a>
            {item.name}
            {' '}
            {item.id === 'messages' && `(${totalUnreadMessage})`}
          </a>
        </Link>
      </Menu.Item>
    );
  });

  const flatten = (menus2, flattenMenus = []) => {
    menus2.forEach((m) => {
      if (m.children) {
        flatten(m.children, flattenMenus);
      }
      const tmp = { ...m };
      delete tmp.children;
      flattenMenus.push(tmp);
    });

    return flattenMenus;
  };

  const getSelectedKeys = () => {
    const { pathname } = router;
    const flatTree = flatten(menus);
    return (
      flatTree
        // .filter((m) => pathname.includes(m.as || m.route))
        .filter((m) => (pathname === m.route || pathname === m.as))
        .map((m) => m.id)
    );
  };

  const menuProps = collapsed
    ? {}
    : {
      openKeys
    };

  const onSelect = ({ key }) => {
    const flatTree = flatten(menus);
    const keys = flatTree.filter((m) => m.id === key).map((m) => m.id);
    setSelectedKeys(keys);
  };

  useEffect(() => {
    const keys = getSelectedKeys();
    setSelectedKeys(keys);
  }, [menus, router]);

  return (
    <Menu
      key="profile-menu"
      mode="inline"
      theme={theme as any}
      selectedKeys={selectedKeys}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      onClick={onClick}
      // onClick={
      //   isMobile
      //     ? () => {
      //         onCollapseChange(true);
      //       }
      //     : undefined
      // }
      {...menuProps}
    >
      {generateMenus(menus)}
    </Menu>
  );
}

export default withRouter(SiderMenu);
