import { getStreamConversation } from '@redux/stream-chat/actions';
import classnames from 'classnames';
import { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import MessageList from './MessageList';

interface IProps {
  streamId?: string;
}

const mapStates = (state: any) => ({
  activeConversation: state.streamMessage.activeConversation,
  loggedIn: state.auth.loggedIn
});
const mapDispatch = { dispatchGetStreamConversation: getStreamConversation };

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

function StreamMessenger({
  streamId = null,
  activeConversation,
  loggedIn,
  dispatchGetStreamConversation
}: IProps & PropsFromRedux) {
  useEffect(() => {
    if (!activeConversation && streamId) {
      dispatchGetStreamConversation({ conversation: activeConversation.data, isPublic: true });
    }
  }, []);

  return (
    <div className={classnames(['message-stream'], loggedIn ? ['user-logged-in'] : '')}>
      {activeConversation && activeConversation.data && activeConversation.data.streamId ? <MessageList /> : <p>No conversation found.</p>}
    </div>
  );
}

export default connector(StreamMessenger);
