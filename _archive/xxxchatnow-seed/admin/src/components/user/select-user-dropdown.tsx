import { getUsernameAndName } from '@lib/utils';
import { userService } from '@services/user.service';
import { Avatar, message, Select } from 'antd';
import { debounce } from 'lodash';
import { useEffect, useRef, useState } from 'react';

interface IProps {
  placeholder?: string;
  style?: Record<string, string>;
  defaultValue?: any;
  onSelect: Function;
  disabled?: boolean;
  noEmpty?: boolean;
}

export function SelectUserDropdown({
  onSelect,
  defaultValue = null,
  disabled = false,
  noEmpty = false,
  placeholder = 'Filter by user',
  style = null
}: IProps) {
  const [users, setUsers] = useState([]);
  const selectRef = useRef(null);

  const searchUsers = debounce(async (q = '') => {
    try {
      const resp = await userService.search({ q, limit: 200 });
      const { data } = resp.data;

      // check if have defaultValue and put this model to the list if have
      if (defaultValue) {
        const found = data.find((p) => p._id === defaultValue);
        if (!found) {
          try {
            const user = await userService.findById(defaultValue);
            if (user.data) data.push(user.data);
            // eslint-disable-next-line
          } catch {}
        }
      }

      setUsers(data);
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured');
    }
  }, 500);

  const onFocus = () => {
    searchUsers();
  };

  useEffect(() => {
    searchUsers();
  }, []);

  return (
    <Select
      ref={selectRef}
      showSearch
      defaultValue={defaultValue}
      placeholder={placeholder}
      style={style || { width: '300px' }}
      onSearch={searchUsers}
      onChange={(val) => {
        if (noEmpty && !val) message.info('User is require for this action, please select one!');
        onSelect(val);
        selectRef.current?.blur();
      }}
      optionFilterProp="children"
      disabled={disabled}
      onFocus={onFocus}
    >
      <Select.Option value="" key="default">
        All users
      </Select.Option>
      {users.map((u) => (
        <Select.Option value={u._id} key={u._id}>
          <Avatar
            src={u?.avatar || '/no-avatar.png'}
            alt="avt"
          />
          {' '}
          {getUsernameAndName(u)}
        </Select.Option>
      ))}
    </Select>
  );
}
