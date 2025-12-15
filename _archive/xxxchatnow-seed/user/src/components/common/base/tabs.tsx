import { SizeType } from 'antd/lib/config-provider/SizeContext';
import classnames from 'classnames';
import RcTabs, { TabPane as RcTabPane, TabsProps as RcTabsProps } from 'rc-tabs';
import { useEffect, useState } from 'react';

export interface TabsProps extends RcTabsProps {
  animated?: any;
  size?: SizeType;
}

export const TabPane = RcTabPane;

export function Tabs({
  prefixCls = 'ant-tabs',
  size = 'large',
  animated = {
    inkBar: false,
    tabPane: false
  },
  defaultActiveKey,
  activeKey,
  className,
  onChange = () => {},
  ...props
}: TabsProps) {
  const [actK, setActiveKey] = useState(activeKey || defaultActiveKey);
  const onTabClick = (key) => {
    setActiveKey(key);
    onChange(key);
  };

  useEffect(() => {
    setActiveKey(activeKey || defaultActiveKey);
  }, [activeKey]);

  return (
    <RcTabs
      className={classnames(className, { [`${prefixCls}-${size}`]: size })}
      prefixCls={prefixCls}
      activeKey={actK}
      defaultActiveKey={actK}
      renderTabBar={(_, TabNavList: any) => (
        <TabNavList
          animated={animated}
          onTabClick={onTabClick}
          activeKey={actK}
        />
      )}
      animated={animated}
      {...props}
    />
  );
}
