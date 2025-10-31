import React from 'react';

import style from './ConversationSearch.module.less';

export default function ConversationSearch({ onSearch }: any) {
  return (
    <div className={style['conversation-search']}>
      <input
        onChange={onSearch}
        type="search"
        className={style['conversation-search-input']}
        placeholder="Search conversation..."
      />
    </div>
  );
}
