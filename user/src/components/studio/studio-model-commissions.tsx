import PopupCommission from '@components/common/base/popup-commission';
import { studioService } from '@services/studio.service';
import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';

import StudioCommissionsTable from './models-manager/studio-commissions-table';

function StudioModelCommissions() {
  const offsetRef = useRef(0);
  const [searching, setSearching] = useState(true);
  const [data, setData] = useState({
    total: 0,
    data: []
  });
  const [updatingPerformer, setUpdatingPerformer] = useState(null);

  const defaultSearch = {
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sort: 'desc'
  };

  const search = async () => {
    try {
      setSearching(true);
      const resp = await studioService.getMemberCommissions({
        ...defaultSearch,
        offset: offsetRef.current
      });
      setData(resp.data);
    } catch {
      // TODO - set error
    } finally {
      setSearching(false);
    }
  };

  const update = (performer) => {
    setUpdatingPerformer(performer);
  };

  const handleTableChange = (pagination) => {
    const offset = (pagination.current - 1) * defaultSearch.limit;
    offsetRef.current = offset;
    search();
  };

  const updateCommission = async (performerId, values) => {
    await studioService.updateMemberCommission(performerId, values);
    message.success('Commission setting has been updated!');
    setUpdatingPerformer(null);
    search();
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <>
      <StudioCommissionsTable
        data={data.data}
        searching={searching}
        total={data.total}
        update={update}
        onChange={handleTableChange.bind(this)}
        pageSize={defaultSearch.limit}
      />
      {updatingPerformer
      && (
      <PopupCommission
        updatingPerformer={updatingPerformer}
        onFinish={updateCommission}
        submiting={searching}
        defaultVisible
        onCancel={() => setUpdatingPerformer(null)}
      />
      )}
    </>

  );
}

export default StudioModelCommissions;
