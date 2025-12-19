import { IPerformer } from '@interfaces/performer';
import dynamic from 'next/dynamic';
import React from 'react';
import { useSelector } from 'react-redux';

const Wheel = dynamic(() => import('./wheel'), { ssr: false });

interface IProps {
  performer: IPerformer;
  cancel: () => void;
  conversationId: string;
}

function getSegments(segments: any[]) {
  if (segments.length >= 5) return segments;

  let result = segments;
  const repeatCount = Math.floor(5 / segments.length);

  for (let i = 0; i < repeatCount; i += 1) {
    result = result.concat(...segments);
  }

  return result;
}

function WheelContainer({
  performer, cancel, conversationId
}: IProps) {
  const visibleWheel = useSelector((state: any) => state.streaming.visibleWheel);

  const segments = React.useMemo(() => (performer?.wheelOptions.length > 0 ? getSegments(performer?.wheelOptions) : []), [performer?.wheelOptions]);

  return (
    visibleWheel && (
      <Wheel
        segments={segments}
        conversationId={conversationId}
        performer={performer}
        onFinish={cancel}
      />
    )
  );
}

export default WheelContainer;
