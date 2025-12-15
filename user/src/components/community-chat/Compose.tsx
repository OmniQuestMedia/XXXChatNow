/* eslint-disable no-return-assign */
import { SendOutlined, SmileOutlined } from '@ant-design/icons';
import SendTipBtn from '@components/streaming/tip/send-tip-btn';
import { sendMessage, sentFileSuccess } from '@redux/message/actions';
import { currentUserSelector } from '@redux/selectors';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import style from './Compose.module.less';
// import { ImageMessageUpload } from '@components/messages/uploadPhoto';
// import { authService } from '@services/index';
import Emotions from './emotions';

interface IProps {
  sendMessage: Function;
  // sentFileSuccess: Function;
  sendMessageStatus: any;
  conversation: any;
  currentUser: any;
}

class Compose extends PureComponent<IProps> {
  uploadRef: any;

  _input: any;

  constructor(props) {
    super(props);
    this.uploadRef = React.createRef();
  }

  state = { text: '' };

  componentDidMount() {
    if (!this.uploadRef) this.uploadRef = React.createRef();
    if (!this._input) this._input = React.createRef();
  }

  componentDidUpdate(previousProps: IProps) {
    const { sendMessageStatus } = this.props;
    if (sendMessageStatus.success !== previousProps.sendMessageStatus.success) {
      this.setMessage('');
      this._input && this._input.focus();
    }
  }

  setMessage(msg: string) {
    this.setState({ text: msg });
  }

  onKeyDown = (evt) => {
    if (evt.keyCode === 13) {
      this.send();
    }
  };

  onChange = (evt) => {
    this.setState({ text: evt.target.value });
  };

  onEmojiClick = (emojiObject) => {
    const { text } = this.state;
    this.setMessage(text + emojiObject.emoji);
  };

  // onPhotoUploaded = (data: any) => {
  //   const { sentFileSuccess: handleSendFile } = this.props;
  //   if (!data || !data.response) {
  //     return;
  //   }
  //   const imageUrl = (data.response.data && data.response.data.imageUrl) || data.base64;
  //   handleSendFile({ ...data.response.data, ...{ imageUrl } });
  // };

  send() {
    const { text } = this.state;
    if (!text) return;
    const { conversation, sendMessage: handleSend } = this.props;
    handleSend({
      conversationId: conversation._id,
      data: {
        text
      }
    });
  }

  render() {
    const { text } = this.state;
    const { sendMessageStatus: status, conversation, currentUser } = this.props;
    // const uploadHeaders = {
    //   authorization: authService.getToken()
    // };
    if (!this.uploadRef) this.uploadRef = React.createRef();
    if (!this._input) this._input = React.createRef();
    return (
      <div className={style.compose}>
        <Input
          value={text}
          className={style['compose-input']}
          placeholder="Type a message"
          onKeyDown={this.onKeyDown}
          onChange={this.onChange}
          disabled={status.sending || !conversation._id}
          ref={(c) => this._input = c}
        />
        <div className={style['grp-icons']}>
          <div className={classNames(style['grp-emotions'], { [style['on-typing']]: text.length })}>
            <SmileOutlined className={style['emoji-icon']} />
            <Emotions onEmojiClick={this.onEmojiClick.bind(this)} />
            {currentUser?._id !== conversation?.performerId && <SendTipBtn performer={{ _id: conversation?.performerId } as any} />}
            <SendOutlined onClick={this.send.bind(this)} disabled={status.sending} className={style['send-icon']} />
          </div>
        </div>
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  sendMessageStatus: state.message.sendMessage,
  currentUser: currentUserSelector(state)
});

const mapDispatch = { sendMessage, sentFileSuccess };
export default connect(mapStates, mapDispatch)(Compose);
