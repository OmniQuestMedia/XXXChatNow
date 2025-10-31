import { IPerformer } from '@interfaces/performer';
import { IUser } from '@interfaces/user';
import { currentUserSelector } from '@redux/selectors';
import { showWheel } from '@redux/streaming/actions';
import { Button, message } from 'antd';
import classNames from 'classnames';
import { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import styles from './wheel-btn.module.less';

interface IProps {
performer: IPerformer;
children: ReactNode;
classname?: string;
}

export function WheelBtn({ performer, children, classname = '' }: IProps) {
  const dispatch = useDispatch();

  const user = useSelector((state) => currentUserSelector(state)) as IUser;

  const onOpenSpinWheel = () => {
    if (!user?._id) {
      message.error('Please login to use wheel !');
      return;
    }
    if (user && user?.balance < performer?.spinWheelPrice) {
      message.error(`Each time spin required ${performer.spinWheelPrice}, please add more`);
      return;
    }
    dispatch(showWheel());
  };

  return (
    performer?.wheelOptions?.length > 0 && (
      <Button
        onClick={onOpenSpinWheel}
        type="default"
        size="middle"
        className={classNames(styles['btn-wheel'], classname)}
      >
        {children}
      </Button>
    )
  );
}
