import {
  Button, Form, Input, Select
} from 'antd';
import { ILeaderBoard } from 'src/interfaces';

interface IProps {
  leaderboard: ILeaderBoard;
  onFinish: Function;
  submiting: boolean
}

function LeaderBoardForm({ leaderboard, onFinish, submiting }: IProps) {
  return (
    <Form
      labelAlign="left"
      labelCol={{ span: 2 }}
      wrapperCol={{ span: 16 }}
      onFinish={onFinish.bind(this)}
      initialValues={
        leaderboard || ({
          title: '',
          duration: '',
          type: '',
          status: ''
        } as ILeaderBoard)
      }
    >
      <Form.Item name="title" label="Title">
        <Input />
      </Form.Item>

      <Form.Item name="duration" label="Duration">
        <Select disabled>
          <Select.Option key="last_day" value="last_day">
            Last Day
          </Select.Option>
          <Select.Option key="last_week" value="last_week">
            Last Week
          </Select.Option>
          <Select.Option key="last_month" value="last_month">
            Last Month
          </Select.Option>
          <Select.Option key="last_year" value="last_year">
            Last Year
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="type" label="Type">
        <Select disabled>
          <Select.Option key="totalEarned" value="totalEarned">
            Top earning performer
          </Select.Option>
          <Select.Option key="totalSpent" value="totalSpent">
            Top spent token user
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="status" label="Status">
        <Select>
          <Select.Option key="active" value="active">
            Active
          </Select.Option>
          <Select.Option key="inactive" value="inactive">
            Inactive
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={submiting} disabled={submiting}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}

export default LeaderBoardForm;
