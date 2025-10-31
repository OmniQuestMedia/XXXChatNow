/* eslint-disable no-return-assign */
import {
  DeleteOutlined,
  SendOutlined, SettingOutlined,
  SmileOutlined
} from '@ant-design/icons';
import { getResponseError } from '@lib/utils';
import { currentUserSelector } from '@redux/selectors';
import {
  resetAllStreamMessage,
  sendStreamMessage
} from '@redux/stream-chat/actions';
import { messageService } from '@services/message.service';
import {
  Dropdown, Input, InputRef, Menu, message
} from 'antd';
import classNames from 'classnames';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { IPerformer, IUser } from 'src/interfaces';

import SendTipBtn from '../streaming/tip/send-tip-btn';
import style from './Compose.module.less';
import Emotions from './emotions';

interface IProps {
  loggedIn: boolean;
  sendStreamMessage: Function;
  sendMessage: any;
  conversation: any;
  user: IUser;
  resetAllStreamMessage: any;
  activeConversation: any;
  currentUser: any;
  performer: IPerformer;
}
class Compose extends PureComponent<IProps> {
  uploadRef: any;

  _input = React.createRef<InputRef>();

  constructor(props) {
    super(props);
    this.uploadRef = React.createRef();
  }

  state = { text: '' };

  componentDidMount() {
    if (!this.uploadRef) this.uploadRef = React.createRef();

    document.addEventListener('click', this.outsideClickListener);
    window.addEventListener('resize', this.onresize);
  }

  componentDidUpdate(previousProps: IProps) {
    const { sendMessage } = this.props;
    if (sendMessage.success !== previousProps.sendMessage.success) {
      this.setText('');
      this._input.current && this._input.current.focus();
    }
  }

  componentWillUnmount(): void {
    document.removeEventListener('click', this.outsideClickListener);
    window.removeEventListener('resize', this.onresize);
  }

  onKeyDown = (evt) => {
    if (evt.keyCode === 13) {
      this.send();
    }
  };

  onChange = (evt) => {
    this.setText(evt.target.value);
    const EmojiPickerReact = document.querySelector('.EmojiPickerReact') as HTMLDivElement;
    if (EmojiPickerReact) EmojiPickerReact.classList.remove('active');
  };

  onEmojiClick = (emojiObject) => {
    const { text } = this.state;
    this.setText(text + emojiObject.emoji);
    const EmojiPickerReact = document.querySelector('.EmojiPickerReact') as HTMLDivElement;
    if (EmojiPickerReact) EmojiPickerReact.classList.remove('active');
  };

  onSmileClick() {
    const EmojiPickerReact = document.querySelector('.EmojiPickerReact') as HTMLDivElement;
    if (EmojiPickerReact) {
      if (EmojiPickerReact.classList.contains('active')) {
        EmojiPickerReact.classList.remove('active');
      } else {
        EmojiPickerReact.classList.add('active');
      }
    }
  }

  setText(text) {
    this.setState({ text });
  }

  outsideClickListener = (event) => {
    const element = document.getElementById('grpIcon');
    if (!element.contains(event.target)) {
      const EmojiPickerReact = document.querySelector('.EmojiPickerReact') as HTMLDivElement;
      if (EmojiPickerReact) EmojiPickerReact.classList.remove('active');
    }
  };

  onresize = () => {
    this._input.current && this._input.current.focus();
  };

  removeAllMessages = async () => {
    try {
      if (!window.confirm('Are you sure you want to remove chat history?')) {
        return;
      }

      const {
        activeConversation,
        resetAllStreamMessage: dispatchResetAllMessage,
        currentUser
      } = this.props;

      if (
        !activeConversation.data
        || (currentUser.isPerformer && currentUser._id !== activeConversation.data.performerId)
      ) {
        return;
      }

      await messageService.deleteAllMessageInConversation(
        activeConversation.data._id
      );
      dispatchResetAllMessage && dispatchResetAllMessage({ conversationId: activeConversation.data._id });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  send() {
    const { text } = this.state;
    const { loggedIn } = this.props;
    if (!loggedIn) {
      message.error('Please login');
      return;
    }

    if (!text) {
      return;
    }

    const { conversation, sendStreamMessage: dispatchSendStreamMessage } = this.props;
    const { _id, type } = conversation;
    dispatchSendStreamMessage({
      conversationId: _id,
      data: {
        text
      },
      type
    });
  }

  render() {
    const {
      loggedIn, user, activeConversation, currentUser, performer
    } = this.props;
    const { text } = this.state;
    const { sendMessage, conversation } = this.props;
    if (!this.uploadRef) this.uploadRef = React.createRef();
    return (
      <div className={style.compose} hidden={!loggedIn || !conversation._id}>
        <Input
          value={text}
          className={style['compose-input']}
          placeholder="Enter message here."
          onKeyDown={this.onKeyDown}
          onChange={this.onChange}
          disabled={sendMessage.sending}
          ref={this._input}
        />
        <div id="grpIcon" className={style['grp-icons']}>
          <div className={classNames(style['grp-emotions'], { [style['on-typing']]: text.length })}>
            <SmileOutlined onClick={this.onSmileClick} className={style['emoji-icon']} />
            <Emotions handleEmojiClick={this.onEmojiClick.bind(this)} />
            {(performer && user?._id && !user?.isPerformer) && <SendTipBtn performer={performer} />}
            <SendOutlined onClick={this.send.bind(this)} disabled={sendMessage.sending} className={style['send-icon']} />
          </div>
        </div>

        {currentUser?.isPerformer && activeConversation?.data && (
          <Dropdown
            overlay={(
              <Menu>
                <Menu.Item onClick={this.removeAllMessages}>
                  <span>
                    <DeleteOutlined />
                    {' '}
                    Clear message history
                  </span>
                </Menu.Item>
              </Menu>
            )}
            placement="topLeft"
            trigger={['click']}
          >
            <SettingOutlined style={{ fontSize: '20px', marginLeft: '5px' }} />
          </Dropdown>
        )}
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  loggedIn: state.auth.loggedIn,
  sendMessage: state.streamMessage.sendMessage,
  user: state.user.current,
  currentUser: currentUserSelector(state),
  activeConversation: state.streamMessage.activeConversation,
  performer: state.streaming.performer
});

const mapDispatch = {
  sendStreamMessage,
  resetAllStreamMessage
};
export default connect(mapStates, mapDispatch)(Compose);
