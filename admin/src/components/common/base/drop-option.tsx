import { BarsOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu } from 'antd';

type IProps = {
  onMenuClick: any,
  menuOptions?: any[],
  buttonStyle?: any,
  dropdownProps?: any
}

export function DropOption({
  onMenuClick, menuOptions = [], buttonStyle = null, dropdownProps = null
}: IProps) {
  const menu = menuOptions.map((item) => (
    <Menu.Item key={item.key}>{item.name}</Menu.Item>
  ));
  return (
    <Dropdown
      overlay={<Menu onSelect={onMenuClick}>{menu}</Menu>}
      {...dropdownProps}
    >
      <Button style={{ border: 'none', ...buttonStyle }}>
        <BarsOutlined style={{ marginRight: 2 }} />
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}

export default DropOption;
