import PageTitle from '@components/common/page-title';
import LovenseExtension from '@components/lovense/extension';
import dynamic from 'next/dynamic';
import { connect, ConnectedProps } from 'react-redux';

const ModelPublicStreamWithChatBox = dynamic(() => import('@components/streaming/model-public-stream-with-chatbox'), {
  suspense: false
});

const mapStates = (state) => ({
  performer: state.performer.current
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function PerformerLivePage({
  performer
}: PropsFromRedux) {
  return (
    <>
      <PageTitle title="Live Room" />
      <LovenseExtension model={performer.username as string}>
        <ModelPublicStreamWithChatBox performer={performer} />
      </LovenseExtension>
    </>
  );
}

PerformerLivePage.authenticate = true;
PerformerLivePage.layout = 'stream';
export default connector(PerformerLivePage);
