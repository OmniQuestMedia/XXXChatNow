import dynamic from 'next/dynamic';
import { connect, ConnectedProps } from 'react-redux';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const StudioModelCommissions = dynamic(() => import('@components/studio/studio-model-commissions'));

const mapStates = (state) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function StudioModelsPage({ singularTextModel = 'Performer' }: PropsFromRedux) {
  return (
    <div className="studio-commisson-background">
      <PageTitle title={`${singularTextModel} commissions`} />
      <PageHeader title="Commissions" />
      <div className="studio-commisson-box">
        <StudioModelCommissions />
      </div>
    </div>
  );
}
StudioModelsPage.authenticate = 'studio';
StudioModelsPage.layout = 'primary';

export default StudioModelsPage;
