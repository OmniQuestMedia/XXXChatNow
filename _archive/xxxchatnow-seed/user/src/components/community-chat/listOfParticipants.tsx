import {
  CrownOutlined
} from '@ant-design/icons';
import { communityChatService } from '@services/commnunity-chat.service';
import { Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

interface Iprops {
  currentUser: any;
  data: any;
}

export default function ListOfParticipants({
  currentUser,
  data
}: Iprops) {
  const [participants, setParticipants] = useState([]);

  const interval = useRef<any>();

  const search = async (conversationId) => {
    if (!conversationId) {
      setParticipants([]);
      return;
    }

    try {
      const resp = await communityChatService.listParticipant(conversationId);
      setParticipants(resp.data);
      interval.current = setTimeout(() => search(conversationId), 10 * 1000);
    } catch {
      clearTimeout(interval.current);
    }
  };

  useEffect(() => {
    clearTimeout(interval.current);
    search(data._id);

    return () => {
      clearTimeout(interval.current);
    };
  }, [data, currentUser]);

  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => {
      clearTimeout(interval.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ padding: 10 }}
    >
      {participants.length > 0 && participants.map((participant) => (
        <div>
          <Tooltip title={participant.username}>
            <span>
              {participant.username || 'N/A'}
              {' '}
              {participant._id === data.performerId && <CrownOutlined />}
            </span>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}
