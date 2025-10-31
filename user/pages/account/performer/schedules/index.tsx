import {
  Col, List,
  message, Row, Tabs
} from 'antd';
import moment from 'moment';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { IPerformer } from 'src/interfaces';
import { formatDate } from 'src/lib';
import { getDefaultSchedule, getNextShow, getResponseError } from 'src/lib/utils';
import {
  updateCurrentPerformer,
  updatePerformerProfile
} from 'src/redux/performer/actions';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const ListItem = dynamic(() => import('@components/common/base/list-item'), { ssr: false });
const PerformerSchedulesForm = dynamic(() => import('@components/schedules/form'), { ssr: false });

interface IProps {
  action: string;
  performer: IPerformer;
  updating: boolean;
  updateSuccess: boolean;
  updateError: any;
  updatePerformerProfile: Function;
}

function PerformerProfilePage({
  updateSuccess,
  updateError,
  action,
  performer,
  updating,
  updatePerformerProfile: dispatchUpdatePerformerProfile
}: IProps) {
  const schedule = performer.schedule || getDefaultSchedule();
  const preUpdateSuccess = useRef(updateSuccess);
  const preUpdateError = useRef(updateError);

  useEffect(() => {
    if (preUpdateSuccess.current !== updateSuccess && updateSuccess) {
      message.success('Update Profile Success.');
    }

    if (preUpdateError.current !== updateError && updateError) {
      message.error(getResponseError(updateError));
    }
  }, [updateSuccess, updateError]);

  const onTabsChange = (key: string) => {
    Router.push(
      {
        pathname: '/account/performer/schedules',
        query: { action: key }
      },
      `/account/performer/schedules?action=${key}`,
      { shallow: false, scroll: false }
    );
  };

  const onFinish = (data: any) => {
    dispatchUpdatePerformerProfile({ ...performer, ...data });
  };

  return (
    <div className={style['performer-schedule-page']}>
      <PageTitle title="Scheduling" />
      <PageHeader title="Schedules" />
      <Tabs
        activeKey={action || 'schedules'}
        style={{ padding: '0 24px' }}
        size="large"
        onChange={onTabsChange.bind(this)}
      >
        <Tabs.TabPane tab="Schedules" key="schedules">
          <Row>
            <Col sm={{ span: 12 }} xs={{ span: 24 }}>
              <List itemLayout="horizontal">
                <ListItem
                  title="Next Show"
                  description={getNextShow(schedule)}
                  titleLayout={{ sm: { span: 6 }, xs: { span: 12 } }}
                  descriptionLayout={{ sm: { span: 18 }, xs: { span: 12 } }}
                />
                {Object.keys(schedule).map((key) => (
                  <ListItem
                    title={formatDate(moment().day(key).toDate(), 'dddd')}
                    description={
                        !schedule[key].closed
                        // `${performer.schedule[key].start}`
                        && `${schedule[key].start} - ${schedule[key].end}`
                      }
                    titleLayout={{ sm: { span: 6 }, xs: { span: 12 } }}
                    descriptionLayout={{
                      sm: { span: 18 },
                      xs: { span: 12 }
                    }}
                    key={key}
                  />
                ))}
              </List>
            </Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Edit Schedule Details" key="edit-schedules">
          <PerformerSchedulesForm
            onFinish={onFinish.bind(this)}
            schedule={schedule}
            updating={updating}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

const mapStateToProps = (state) => ({
  performer: state.performer.current,
  updating: state.performer.updating,
  updateSuccess: state.performer.updateSuccess,
  updateError: state.performer.updateError,
  categoriesData: state.performer.categories.data
});

PerformerProfilePage.authenticate = true;
PerformerProfilePage.layout = 'primary';
PerformerProfilePage.getInitialProps = (ctx) => {
  const { query } = ctx;
  return {
    action: query.action
  };
};

const mapDispatchs = { updatePerformerProfile, updateCurrentPerformer };
export default connect(mapStateToProps, mapDispatchs)(PerformerProfilePage);
