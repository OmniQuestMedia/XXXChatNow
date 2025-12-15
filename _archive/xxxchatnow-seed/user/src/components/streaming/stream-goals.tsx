import { generateUuid } from '@lib/string';
import { getResponseError } from '@lib/utils';
import { receiveStreamMessageSuccess } from '@redux/stream-chat/actions';
import { streamGoalsService } from '@services/stream-goals.service';
import { message } from 'antd';
import { findLastIndex } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

interface Props {
  streamId: string;
  conversationId: string;
}

export function StreamGoals({ streamId, conversationId }: Props) {
  const [title, setTitle] = useState(null);

  const getStreamGoalInterval = useRef<any>();

  const dispatch = useDispatch();

  const getStremGoals = async (loaded = false) => {
    if (!streamId) return;
    try {
      const response = await streamGoalsService.getStreamGoals(streamId);

      const streamGoal = { ...response.data };

      if (!streamGoal._id) return;

      !loaded && dispatch(receiveStreamMessageSuccess({
        _id: generateUuid(),
        conversationId,
        type: 'notification',
        text: response.data.goals.sort((a, b) => -a.ordering + b.ordering).reduce((a, b) => `${a} <br /> &#129505 #${b.ordering} - ${b.name} - ${b.token}`, '')
      }));

      const arr = response.data.goals.sort((a, b) => a.token > b.token) as any[];
      const index = findLastIndex(arr, ((x) => x.token <= response.data.remainToken));

      if (index === -1) {
        setTitle(`Goal: ${response.data.remainToken} tk -- next goal: ${arr[0] ? arr[0].name : ''}`);
      } else {
        setTitle(`Goal: ${response.data.remainToken} tk ${arr[index] ? arr[index].name : ''} -- next goal: ${arr[index + 1] ? arr[index + 1].name : ''}`);
      }
    } catch (e) {
      const error = await e;
      message.error(getResponseError(error));
    } finally {
      !loaded && setTimeout(() => { getStremGoals(true); }, 1000);

      if (loaded) {
        getStreamGoalInterval.current = setTimeout(() => { getStremGoals(true); }, 3000);
      }
    }
  };

  useEffect(() => {
    setTimeout(getStremGoals, 5000);

    return () => {
      clearTimeout(getStreamGoalInterval.current);
      getStreamGoalInterval.current = null;
    };
  }, [streamId]);

  return title;
}
