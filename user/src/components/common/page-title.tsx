import { truncate } from 'lodash';
import Head from 'next/head';
import { connect, ConnectedProps } from 'react-redux';

export interface IPageTitleProps {
  title: string;
}

const mapStates = (state: any) => ({
  ui: state.ui
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function PageTitle({
  title,
  ui
}: PropsFromRedux & IPageTitleProps) {
  const itemTitle = `${truncate(title)} | ${ui.siteName}`;

  return (
    <Head>
      <title>{itemTitle}</title>
    </Head>
  );
}

export default connector(PageTitle);
