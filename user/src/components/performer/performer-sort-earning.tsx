import { performerService } from '@services/perfomer.service';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';

import PerformerGrid from './performer-grid';

export default function PerformerWithEarning() {
  const [performers, setPerformers] = useState([]);

  const getPerformer = async () => {
    try {
      const resp = await performerService.search({ sortBy: 'stats.totalTokenEarned', limit: 12 });
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
      <h1 style={{ fontWeight: 'bold', color: '#000' }}>Popular Models</h1>
      {performers.length > 0 && <PerformerGrid data={performers} total={performers.length} success />}
    </>
  );
}
