import { CrownTwoTone, MoreOutlined } from '@ant-design/icons';
import UserRank from '@components/user/user-rank';
import { IUser } from '@interfaces/user';
import { getResponseError } from '@lib/utils';
import { currentUserSelector } from '@redux/selectors';
import { wheelResultService } from '@services/wheel-result.service';
import {
  Button, Dropdown, Menu, message, Space
} from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import style from './Message.module.less';

export default function Message(dataProps: any) {
  const {
    data,
    // isMine,
    // startsSequence,
    // endsSequence,
    showTimestamp,
    isOwner,
    canDelete,
    onDelete
    // data: { type }
  } = dataProps;

  const [acceptWheel, setAcceptWheel] = useState(false);
  const user = useSelector((state) => currentUserSelector(state)) as IUser;
  const onUpdateWheelRequest = async (isAccept: boolean) => {
    try {
      const status = isAccept ? 'accepted' : 'rejected';
      data.wheelResultId && await wheelResultService.updateStatus(data.wheelResultId, { status });
      setAcceptWheel(true);
      message.success(`${status} ${data.text}`);
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };

  const chatBoxMessageClassName = (req) => {
    const {
      isMine,
      startsSequence,
      endsSequence,
      data: { type }
    } = req;
    return classNames(
      style.message,
      { mine: isMine && type !== 'tip' ? 'mine' : '' },
      { tip: type === 'tip' ? 'tip' : '' },
      { start: !!startsSequence },
      { end: !!endsSequence }
    );
  };

  const friendlyTimestamp = moment(data.createdAt).format('LLLL');
  // const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  const menu = (
    <Menu>
      <Menu.Item onClick={onDelete}>
        <a>delete</a>
      </Menu.Item>
    </Menu>
  );

  if (data.type === 'notification') {
    return <div dangerouslySetInnerHTML={{ __html: data.text }} />;
  }

  return (
    <div
      className={chatBoxMessageClassName(dataProps)}
    // className={[
    //   'message',
    //   `${isMine && data.type !== 'tip' ? 'mine' : ''}`,
    //   `${data.type === 'tip' ? 'tip' : ''}`,
    //   `${startsSequence ? 'start' : ''}`,
    //   `${endsSequence ? 'end' : ''}`
    // ].join(' ')}
    >
      {data.text && !data.isSystem && (
        <div className="bubble-container">
          <div className="bubble" title={friendlyTimestamp}>

            {data.senderInfo && (
              <span className="u-name">
                {isOwner ? (
                  <span style={{ fontSize: 13, fontWeight: 'bold' }}>
                    <CrownTwoTone twoToneColor="#eb2f96" />
                    {' '}
                    {data.senderInfo.username}
                  </span>
                ) : (
                  <UserRank rank={data.senderRank} username={data.senderInfo.username} />
                )}
                {data?.senderInfo?.displayName || data.senderInfo.username || 'N/A'}
                {data.type !== 'tip' ? ': ' : ' '}
              </span>
            )}
            {!data.imageUrl && data.text}
            {' '}
            {data.imageUrl && (
              <a
                title="Click to view full content"
                href={
                  data.imageUrl.indexOf('http') === -1 ? '#' : data.imageUrl
                }
                target="_blank"
                rel="noreferrer"
                aria-hidden
              >
                <img src={data.imageUrl} width="180px" alt="" />
              </a>
            )}

          </div>
          {canDelete && (
            <Dropdown overlay={menu} placement="topRight">
              <span>
                <MoreOutlined />
                {' '}
              </span>
            </Dropdown>
          )}
        </div>
      )}
      {data.text && data.type !== 'wheel' && data.type !== 'accept-wheel' && data.isSystem && (
        <p style={{ textAlign: 'center', fontSize: '14px' }}>{data.text}</p>
      )}
      {data.text && data.type === 'wheel' && data.isSystem && (
        <div className={style['wheel-result']}>
          {data.text}
        </div>
      )}
      {data.text && data.type === 'accept-wheel' && data.performerId === user?._id && data.isSystem && !acceptWheel && (
        <div className={style['wheel-result']}>
          <div>{data.text}</div>
          <br />
          <div>
            <div>
              <Space>
                <Button type="primary" onClick={() => onUpdateWheelRequest(true)}>Accept</Button>
                <Button type="default" onClick={() => onUpdateWheelRequest(false)}>Reject</Button>
              </Space>
            </div>
          </div>
        </div>
      )}
      {showTimestamp && !data.isSystem && (
        <div className="timestamp">{friendlyTimestamp}</div>
      )}
    </div>
  );
}
