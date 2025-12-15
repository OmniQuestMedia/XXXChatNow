import { resetMessageState } from '@redux/message/actions';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { connect } from 'react-redux';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const Messenger = dynamic(() => import('@components/messages/Messenger'), { ssr: false });

interface IProps {
  query: Record<string, string>;
  resetStateHandler: Function;
}

function Messages({
  query,
  resetStateHandler
}: IProps) {
  useEffect(() => () => {
    resetStateHandler();
  }, []);

  return (
    <>
      <PageTitle title="Messages" />
      <Messenger toSource={query.toSource} toId={query.toId} />
    </>
  );
}

Messages.authenticate = true;
Messages.layout = 'primary';
Messages.getInitialProps = (ctx) => ({
  query: ctx.query
});

const mapDispatch = {
  resetStateHandler: resetMessageState
};
export default connect(null, mapDispatch)(Messages);
