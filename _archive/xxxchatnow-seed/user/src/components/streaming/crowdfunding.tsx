import { QuestionCircleOutlined } from '@ant-design/icons';
import NumberFormat from '@components/common/layout/numberformat';
import { capitalizeFirstLetter } from '@lib/string';
import { getResponseError } from '@lib/utils';
import { currentUserSelector } from '@redux/selectors';
import { updateCurrentUserBalance } from '@redux/user/actions';
import { crowdfundingService } from '@services/crowdfunding.service';
import { transactionService } from '@services/transaction.service';
import {
  Button, InputNumber, message, Modal, Progress, Tooltip
} from 'antd';
import Router from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ICrowdfunding, IPerformer, IUser } from 'src/interfaces';

import styles from './crowdfunding.module.less';

const round2Decima = (num: number) => Math.round(num * 10 ** 2) / 10 ** 2;

interface IProps {
  performer: IPerformer;
}

function Crowdfunding({
  performer
}: IProps) {
  const dispatch = useDispatch();
  const refCrowdfundingId = useRef(null);
  const [token, setToken] = useState(0);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [crowdfundfings, setCrowdfundfings] = useState([]);
  const loggedIn = useSelector((state: any) => state.auth.loggedIn);
  const user = useSelector((state) => currentUserSelector(state)) as IUser;
  const activeConversation = useSelector((state: any) => state.streamMessage.activeConversation);

  const handleError = async (e) => {
    const error = await Promise.resolve(e);
    message.error(getResponseError(error));
  };

  const [query] = useState({
    offset: 0,
    litmit: 100,
    sortBy: 'createdAt',
    sort: 'desc'
  });

  const getDate = async () => {
    try {
      const resp = await crowdfundingService.userSearch({
        ...query,
        performerId: performer._id
      });
      setCrowdfundfings(resp.data.data);
    } catch (e) {
      handleError(e);
    }
  };

  useEffect(() => {
    getDate();
  }, []);

  const handleContribute = (crowdfundfingId: string) => {
    if (!loggedIn) {
      message.error('Please login');
      Router.push('/auth/login/user');
      return;
    }

    refCrowdfundingId.current = crowdfundfingId;
    setVisible(true);
  };

  const handleConfirm = async () => {
    if (activeConversation?.data?._id) {
      try {
        setSubmitting(true);
        if (parseInt(token.toString(), 10) <= 0) return;

        if (user.balance <= 0) {
          message.error("You don't have enough token balance, please purchase");
          return;
        }

        if (user.balance < token) {
          message.error("You don't have enough token balance, please purchase");
          return;
        }

        await transactionService.sendContributeToken(
          performer._id,
          token,
          refCrowdfundingId.current
        );

        setVisible(false);

        dispatch(updateCurrentUserBalance(-token));

        const content = (
          <NumberFormat value={token} prefix="You sent " suffix=" tokens" />
        );
        message.success(content);
        getDate();
      } catch (e) {
        handleError(e);
      } finally {
        setSubmitting(false);
      }
    } else {
      message.error('You have not joined this conversation.');
    }
  };

  return (
    <div className={styles['section-crowdfunding']}>
      {crowdfundfings.length >= 1 && crowdfundfings.map((crowdfundfing: ICrowdfunding) => (
        <div className={styles['crowdfunding-card']}>
          <div className={styles['crowdfundfing-title']}>
            <h1>
              {crowdfundfing.title}
              {' '}
              <Tooltip
                title={`${capitalizeFirstLetter(performer.username)}'s community crowdfunding campaign`}
              >
                <QuestionCircleOutlined />
              </Tooltip>
            </h1>
            <div>
              <span>
                {crowdfundfing?.contributes?.length}
                {' '}
                contributor
                {crowdfundfing?.contributes?.length > 1 ? 's' : ''}
              </span>
              {' '}
              <Button
                type="primary"
                onClick={() => handleContribute(crowdfundfing._id)}
              >
                Contribute
              </Button>
            </div>
          </div>
          <p className={styles.descriptions}>{crowdfundfing?.descriptions}</p>
          <Progress
            showInfo
            type="line"
            percent={round2Decima((crowdfundfing.remainingToken / crowdfundfing.token) * 100)}
            trailColor="white"
            width={300}
            strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
          />
        </div>
      ))}
      <Modal
        title="How much do you want to contribute?"
        visible={visible}
        footer={null}
        onCancel={() => setVisible(false)}
        className={styles['popup-comfirm-contribute']}
      >
        <div className={styles['contribute-content']}>
          <InputNumber
            min={1}
            autoFocus
            controls={false}
            defaultValue={1}
            placeholder=""
            disabled={submitting}
            onChange={(value) => setToken(value)}
          />
          <Button type="primary" onClick={handleConfirm}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
}

export default Crowdfunding;
