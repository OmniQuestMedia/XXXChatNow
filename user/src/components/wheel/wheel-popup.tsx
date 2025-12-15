import { IPerformer } from '@interfaces/performer';
import {
  Button, Modal
} from 'antd';

import { Wheel } from './wheel';

type IProps = {
  performer: IPerformer;
  openSpinWheelModal: boolean;
  visibleWheel: Function;
  handleSpinWheel: Function;
  conversationId: string;
}

export function WheelPopup({
  performer, openSpinWheelModal, visibleWheel, handleSpinWheel, conversationId
}: IProps) {
  return (
    <Modal
      visible={openSpinWheelModal}
      title={<h3 style={{ textAlign: 'center' }}>Wheel of pleasure</h3>}
      footer={[
        <Button
          key="close"
          className="secondary"
          onClick={() => visibleWheel()}
        >
          Back
        </Button>
      ]}
      onCancel={() => visibleWheel()}
      destroyOnClose
    >
      <Wheel
        options={performer.wheelOptions.map((option) => option.name)}
        onFinish={handleSpinWheel}
        performerId={performer._id}
        conversationId={conversationId}
        price={performer.spinWheelPrice}
      />
    </Modal>
  );
}
