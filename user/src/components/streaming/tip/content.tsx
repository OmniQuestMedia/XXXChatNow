import {
  Alert,
  InputNumber, Radio, Space
} from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { createRef, PureComponent } from 'react';

import style from './content.module.less';

const tokens = [20, 50, 100, 200];

interface IProps {
  setDisableOk: Function;
}

interface IStates {
  radioValue: string | number;
  errorMessage: string;
  token: number;
}

export default class SendTipContent extends PureComponent<IProps, IStates> {
  private inputNumberRef;

  constructor(props: IProps) {
    super(props);
    this.state = {
      radioValue: 20,
      errorMessage: '',
      token: 20
    };
  }

  componentDidMount() {
    this.inputNumberRef = createRef();
  }

  onRadioChange(e: RadioChangeEvent) {
    const { setDisableOk } = this.props;
    setDisableOk(false);
    this.setState({ radioValue: e.target.value });
    if (e.target.value > 0) this.setState({ token: e.target.value });
  }

  onInputChange(value: number) {
    const { setDisableOk } = this.props;
    setDisableOk(false);
    if (typeof (value) !== 'number') {
      return;
    }
    if (value <= 0 || value % 1 !== 0) {
      setDisableOk(true);
      this.setState({ errorMessage: 'Token must be positive integer number!' });
      return;
    }
    this.setState({ token: value, errorMessage: '' });
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  getValueToken() {
    const { token, radioValue } = this.state;
    return radioValue > 0 ? radioValue : token;
  }

  render() {
    const { radioValue, token, errorMessage } = this.state;
    return (
      <div>
        <h3>How Many Tokens Would You Like To Tip?</h3>
        {errorMessage && <Alert type="error" message={errorMessage} />}
        <Radio.Group
          value={radioValue}
          defaultValue={radioValue}
          onChange={this.onRadioChange.bind(this)}
          size="large"
        >
          {tokens.map((v) => (
            <Radio value={v} key={v}>
              <Space className={style['token-radio']} align="start">
                <span>{`${v} Tokens`}</span>
                {/* <span className="tip-description">{`Tip The Model ${v} Tokens!`}</span> */}
              </Space>
            </Radio>
          ))}
          <Radio value={-1}>
            <Space className={style['token-radio']}>
              <span>Enter amount</span>
              <InputNumber
                className={style.amount}
                ref={this.inputNumberRef}
                onFocus={() => this.setState({ radioValue: -1 })}
                type="number"
                min={0}
                max={1000}
                step={10}
                placeholder="Enter Amount"
                onChange={this.onInputChange.bind(this)}
                value={token}
              />
            </Space>
          </Radio>
        </Radio.Group>
      </div>
    );
  }
}
