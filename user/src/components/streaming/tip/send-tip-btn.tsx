import { DollarOutlined } from '@ant-design/icons';
import Popup from '@components/common/base/popup';
import NumberFormat from '@components/common/layout/numberformat';
import { currentUserSelector } from '@redux/selectors';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Button, message
} from 'antd';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IPerformer, IUser } from 'src/interfaces';
import { checkUserLogin, getResponseError } from 'src/lib/utils';
import { transactionService } from 'src/services';

import SendTipContent from './content';

const btnStyle = { height: 50, marginBottom: 1 };

interface Interface {
  performer: IPerformer;
}

function SendTipBtn({
  performer
}: Interface) {
  const tipPopupRef = React.useRef<any>();
  const contentRef = React.useRef<any>(null);
  const [tipping, setTipping] = React.useState(false);
  const [disableOk, setDisableOk] = React.useState(false);
  const user = useSelector((state) => currentUserSelector(state)) as IUser;
  const loggedIn: boolean = useSelector((state: any) => state.auth.loggedIn);
  const conversationId = useSelector((state: any) => state?.streamMessage?.activeConversation?.data?._id || state?.conversation?.activeConversation?._id);

  const dispatch = useDispatch();
  const handleError = async (e) => {
    const error = await Promise.resolve(e);
    message.error(getResponseError(error));
  };

  const sendTip = () => {
    if (!checkUserLogin(loggedIn, user)) {
      message.error(`Please login to send tip${performer?.username ? ` to ${performer.username}` : ''}!`);
      return;
    }

    tipPopupRef.current && tipPopupRef.current.setVisible(true);
  };

  const onOk = async () => {
    if (!performer) return;
    if (conversationId) {
      const ref = tipPopupRef.current;
      try {
        setTipping(true);
        const token = contentRef.current.getValueToken() || 0;
        if (parseInt(token, 10) <= 0) return;

        if (user.balance <= 0) {
          message.error('You dont have enough token balance, please purchase');
          return;
        }

        if (user.balance < token) {
          message.error('The selected tipping amount is more than your account token balance');
          return;
        }

        await transactionService.sendTipToken(
          performer._id,
          token,
          conversationId
        );
        ref && ref.setVisible(false);
        dispatch(updateCurrentUserBalance(-token));
        const content = (
          <NumberFormat value={token} prefix="You sent " suffix=" tokens" />
        );
        message.success(content);
      } catch (e) {
        handleError(e);
      } finally {
        setTipping(false);
      }
    } else {
      message.error('You have not joined this conversation.');
    }
  };

  return (
    <>
      <Popup
        title={`Tip ${performer?.username}`}
        centered
        okButtonProps={{ disabled: disableOk }}
        content={(
          <SendTipContent
            ref={contentRef}
            setDisableOk={setDisableOk}
          />
        )}
        ref={tipPopupRef}
        loading={tipping}
        onOk={onOk}
        width={567}
      />
      <Button
        type="primary"
        style={{ ...btnStyle }}
        className="btn-senttip"
        onClick={() => sendTip()}
        block
        icon={<DollarOutlined />}
      >
        <span>Send Tip</span>
      </Button>

    </>

  );
}
export default SendTipBtn;
