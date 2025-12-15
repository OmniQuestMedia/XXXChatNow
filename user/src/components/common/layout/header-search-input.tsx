import {
  CloseOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Input } from 'antd';
import { useRouter } from 'next/router';
import {
  forwardRef, ReactNode, useEffect, useImperativeHandle, useState
} from 'react';

interface Props {
  pathname: string;
  placeholder?: string;
  icon?: ReactNode;
  onVisible?: Function;
}

function HeaderSearchInput({
  pathname, placeholder = 'Enter keyword', icon = <SearchOutlined />, onVisible = () => {}
}: Props, ref) {
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  const search = (key: string) => {
    router.push({ pathname, query: { q: key } }, `${pathname}?q=${key}`);
  };

  const onSearchPerformer = (key: string) => {
    search(key);
  };

  const onPressEnter = (event) => {
    search(event.target.value);
  };

  useEffect(() => {
    if (showSearch && typeof onVisible === 'function') onVisible();
  }, [showSearch]);

  useImperativeHandle(ref, () => ({
    closeSearch: () => setShowSearch(false)
  }));

  return (
    <>
      <div
        className={showSearch ? 'search-icon active' : 'search-icon'}
        aria-hidden
        onClick={() => setShowSearch(!showSearch)}
      >
        {showSearch ? <CloseOutlined /> : icon}
      </div>
      <div className={!showSearch ? 'hide search-bar' : 'search-bar'}>
        <Input.Search
          placeholder={placeholder}
          loading={false}
          allowClear
          enterButton
          onPressEnter={onPressEnter}
          onSearch={onSearchPerformer}
        />
      </div>

    </>
  );
}

export default forwardRef(HeaderSearchInput);
