import { DownOutlined, StopOutlined } from '@ant-design/icons';
import { getResponseError } from '@lib/utils';
import { currentUserSelector } from '@redux/selectors';
import { performerService } from '@services/perfomer.service';
import { Dropdown, Menu, message } from 'antd';
import React from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';
import { IPerformer, IUser } from 'src/interfaces';

type P = {
  members: Array<IUser>;
  currentPerformer: IPerformer;
  onBlocked?: Function;
}

const mapStates = (state: any) => ({
  placeholderAvatarUrl: state.ui.placeholderAvatarUrl,
  loggedIn: state.auth.loggedIn
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function StreamingChatUsers({
  loggedIn,
  members,
  currentPerformer,
  placeholderAvatarUrl,
  onBlocked = () => { }
}: P & PropsFromRedux) {
  const blockUser = React.useCallback(async ({ key }) => {
    if (!window.confirm('Are you sure to block this user?')) return;
    try {
      await performerService.geoBlock({ userIds: [key] });

      onBlocked({
        userId: key
      });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }, [members]);

  const currentUser = useSelector(currentUserSelector) as IUser;

  return (
    <div className="conversation-users">
      <div className="users" style={{ padding: '5px 10px' }}>
        {members?.map((m) => (
          <div className="user" key={m._id} style={{ marginBottom: 5 }}>
            {loggedIn && currentUser?.isPerformer && currentPerformer?._id === currentUser?._id ? (
              <Dropdown
                overlay={(
                  <Menu>
                    <Menu.Item onClick={blockUser} key={m._id}>
                      <span>
                        <StopOutlined size={16} />
                        {' '}
                        Block this user
                      </span>
                    </Menu.Item>
                  </Menu>
                )}
                placement="bottomLeft"
                trigger={['click']}
              >
                <span className="username">
                  <img
                    alt="avatar"
                    src={m?.avatar || placeholderAvatarUrl || '/default-user-icon.png'}
                    width="35px"
                    height="35px"
                    style={{ borderRadius: '50%', marginRight: '5px', border: '1px solid #ff0066' }}
                  />
                  {m?.displayName || m.username || 'N/A'}
                  {' '}
                  <span style={{ color: m?.memberRank[0].badgingColor, fontWeight: 'bold' }}>{m.username}</span>
                  {m?.memberRank[0].badgingIcon && (
                    <img
                      alt="avatar"
                      src={m?.memberRank[0].badgingIcon}
                      width="15px"
                      height="15px"
                      style={{ borderRadius: '50%' }}
                    />
                  )}
                  <DownOutlined />
                </span>
              </Dropdown>
            ) : (
              <span className="username">
                <img
                  alt="avatar"
                  src={m?.avatar || placeholderAvatarUrl || '/default-user-icon.png'}
                  width="35px"
                  height="35px"
                  style={{ borderRadius: '50%', marginRight: '5px', border: '1px solid #ff0066' }}
                />
                {m?.displayName || m.username || 'N/A'}
                <span style={{ color: m?.memberRank[0].badgingColor, fontWeight: 'bold' }}>{m.username}</span>
                {m?.memberRank[0].badgingIcon && (
                  <img
                    alt="avatar"
                    src={m?.memberRank[0].badgingIcon}
                    width="15px"
                    height="15px"
                    style={{ borderRadius: '50%' }}
                  />
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default connector(StreamingChatUsers);
