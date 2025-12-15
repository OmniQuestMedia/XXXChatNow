import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { updateTotalPerformer } from 'src/redux/studio/actions';
import { studioService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const StudioAddModelForm = dynamic(() => import('@components/studio/models-manager/studio-add-model-form'), { ssr: false });

interface IProps {
  updateTotalPerformer: Function;
}
interface IStates {
  error: boolean;
  loading: boolean;
  message: string;
}

class StudioAddModel extends PureComponent<IProps, IStates> {
  static authenticate = 'studio';

  static layout = 'primary';

  state: IStates = {
    error: false,
    loading: false,
    message: ''
  };

  async onFinish(data) {
    const { updateTotalPerformer: dispatchUpdateTotalPerformer } = this.props;
    try {
      this.setState({ loading: true, error: false, message: '' });
      await studioService.addModel(data);
      message.success('Added successfully');
      dispatchUpdateTotalPerformer(1);
      Router.push('/studio/models');
    } catch (e) {
      const error = await Promise.resolve(e);
      this.setState({ error: true, message: getResponseError(error) });
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { error, loading, message: newMessage } = this.state;
    return (
      <div className={style['studio-models-background']}>
        <PageTitle title="Add new member" />
        <PageHeader title="Add new member" />
        <div className={style['studio-models-box']}>
          <StudioAddModelForm
            onFinish={this.onFinish.bind(this)}
            loading={loading}
            error={error}
            message={newMessage}
          />
        </div>
      </div>
    );
  }
}

export default connect(null, { updateTotalPerformer })(StudioAddModel);
