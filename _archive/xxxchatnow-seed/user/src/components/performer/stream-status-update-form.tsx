import { updateStreamingStatus } from '@redux/performer/actions';
import {
  Button, Col,
  Input, Row
} from 'antd';
import { useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import style from './stream-status.module.less';

type IProps = {
  status?: string;
}

const mapStates = (state) => ({
  updating: state.performer.updating
});

const mapDispatch = {
  dispatchUpdateStreamingStatus: updateStreamingStatus
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

function StreamStatusUpdateForm({
  status = '',
  updating,
  dispatchUpdateStreamingStatus
}: IProps & PropsFromRedux) {
  const [value, setValue] = useState(status);
  const handleClick = () => {
    // submit(value);
    dispatchUpdateStreamingStatus(value);
  };

  return (
    <Row className={style['stream-status']} gutter={[10, 10]}>
      <Col span={18}>
        <Input
          placeholder="Update your status"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Col>
      <Col span={6}>
        <Button
          type="primary"
          onClick={handleClick}
          loading={updating}
          className="mb-10"
          block
          disabled={updating}
        >
          Update
        </Button>
      </Col>
    </Row>
  );
}

export default connector(StreamStatusUpdateForm);
