import { generateUuid } from '@lib/string';
import { getResponseError } from '@lib/utils';
import { streamGoalsService } from '@services/stream-goals.service';
import {
  Button,
  Col,
  Form, Input, InputNumber,
  message,
  Row,
  Space
} from 'antd';
import { useEffect, useState } from 'react';

import s from './goals-form.module.less';

interface Props {
  streamId: string;
}

function GoalsForm({ streamId }: Props) {
  const [form] = Form.useForm();

  const [typeSubmit, setTypeSubmit] = useState('');

  const addGoal = () => {
    const goals = form.getFieldValue('goals');

    const uid = generateUuid();

    form.setFieldsValue({
      goals: [...goals, {
        id: uid,
        name: '',
        token: 1,
        ordering: 0
      }]
    });

    setTypeSubmit('add-goals');
  };

  const resetRemainToken = async () => {
    try {
      await streamGoalsService.resetRemainTokens(streamId);
      message.success('Reset remain tokens success');
    } catch (e) {
      const err = await e;
      message.error(getResponseError(err));
    }
  };

  const onFinish = async (data) => {
    try {
      await streamGoalsService.createStreamGoals(streamId, data);
      message.success(typeSubmit === 'reset-goals' ? 'Reset goals success' : 'Add goals success');
    } catch (e) {
      const err = await e;
      message.error(getResponseError(err));
    }
  };

  useEffect(() => {
    const fetchGoal = async () => {
      const response = await streamGoalsService.getStreamGoals(streamId);

      const streamGoal = { ...response.data };

      if (!streamGoal._id) {
        form.setFieldsValue({
          goals: []
        });
        return;
      }

      form.setFieldsValue({
        goals: response.data.goals
      });
    };

    fetchGoal();
  }, [streamId]);

  return (
    <Form
      form={form}
      initialValues={{
        goals: []
      }}
      onFinish={(data) => onFinish({ ...data })}
      layout="vertical"
    >
      <div className={s.form}>
        <div style={{ margin: '10px', overflow: 'auto' }}>
          <Space>
            <Button onClick={addGoal} type="primary">Add Goals</Button>
            <Button
              onClick={() => {
                form.setFieldsValue({
                  goals: []
                });
                setTypeSubmit('reset-goals');
                form.submit();
              }}
              type="primary"
            >
              Reset all Goals
            </Button>
            <Button onClick={resetRemainToken} type="primary">
              Reset remain Tokens
            </Button>
          </Space>
        </div>
        <div style={{ margin: '10px' }}>
          <Form.Item shouldUpdate>
            {
          (formInstance) => {
            const goals = formInstance.getFieldValue('goals');
            return (goals && goals.length > 0) ? goals.map((arrItem) => (
              <Row style={{ paddingBottom: '10px', borderBottom: '1px solid #e6eaee' }} key={arrItem.id}>
                <Col md={2} sm={3} xs={3}>
                  <span>#</span>
                  <InputNumber
                    type="number"
                    min={0}
                    value={arrItem.ordering}
                    required
                    onChange={(e) => form.setFieldsValue({
                      goals: goals.map((t) => {
                        if (t.id === arrItem.id) {
                          return {
                            ...t,
                            ordering: e
                          };
                        }
                        return t;
                      })
                    })}
                  />
                </Col>
                <Col md={16} sm={15} xs={15} style={{ paddingLeft: '20px' }}>
                  <span>Goals title:</span>
                  <Input
                    value={arrItem.name}
                    placeholder="enter your goals title"
                    required
                    onChange={(e) => form.setFieldsValue({
                      goals: goals.map((t) => {
                        if (t.id === arrItem.id) {
                          return {
                            ...t,
                            name: e.target.value
                          };
                        }
                        return t;
                      })
                    })}
                  />
                </Col>
                <Col md={6} sm={6} xs={6} style={{ paddingLeft: '20px' }}>
                  <span>Token:</span>
                  <InputNumber
                    type="number"
                    min={1}
                    value={arrItem.token}
                    required
                    onChange={(e) => form.setFieldsValue({
                      goals: goals.map((t) => {
                        if (t.id === arrItem.id) {
                          return {
                            ...t,
                            token: e
                          };
                        }
                        return t;
                      })
                    })}
                  />
                </Col>
              </Row>
            )) : <p>Please add goals</p>;
          }
        }
          </Form.Item>
          <Form.Item name="goals" hidden />
        </div>
        <Form.Item style={{ margin: '10px' }}>
          <Button
            type="primary"
            htmlType="submit"
          >
            Submit
          </Button>
        </Form.Item>
      </div>
    </Form>
  );
}

export default GoalsForm;
