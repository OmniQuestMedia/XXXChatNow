import { performerService } from '@services/perfomer.service';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';

import PerformerGrid from './performer-grid';

export default function OnlinePerformer() {
  const [performers, setPerformers] = useState([]);

  const getPerformer = async () => {
    try {
      const resp = await performerService.search({ isOnline: true, limit: 60 });
      setPerformers(resp.data.data);
    } catch {
      message.error('Cannot load performer!');
    }
  };

  useEffect(() => {
    getPerformer();
  }, []);

  return (
    <>
      <h1 style={{ fontWeight: 'bold', color: '#000' }}>Online Now</h1>
      {performers.length > 0 && <PerformerGrid data={performers} total={performers.length} success />}
    </>
  );
}
