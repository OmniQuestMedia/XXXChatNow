import { performerService } from '@services/performer.service';
import { Select } from 'antd';
import { sortBy } from 'lodash';
import { PureComponent } from 'react';

const { Option } = Select;

interface IProps {
  placeholder?: string;
  style?: Record<string, string>;
  defaultValue?: any;
  onSelect: Function;
  disabled?: boolean;
  query?: any;
}

export class SelectPerformerDropdown extends PureComponent<IProps> {
  _initalData = [];

  state = {
    data: [] as any,
    value: undefined
  };

  componentDidMount() {
    this.loadPerformers();
  }

  handleSearch = async (value) => {
    const q = value.toLowerCase();
    const resp = await performerService.search({ limit: 100, q });
    this.setState({
      data: resp.data.data
    });
  };

  async loadPerformers(q = '') {
    const { query, defaultValue } = this.props;
    const resp = await performerService.search({ limit: 100, q, ...query });
    this._initalData = sortBy(resp.data.data, (i) => i.username);

    if (defaultValue) {
      const found = this._initalData.find((p) => p._id === defaultValue);
      if (!found) {
        try {
          const p = await performerService.findById(defaultValue);
          if (p.data) this._initalData.push(p.data);
        } catch {} // eslint-disable-line
      }
    }

    this.setState({
      data: [...this._initalData]
    });
  }

  render() {
    const { disabled } = this.props;
    return (
      <Select
        showSearch
        value={this.state.value}
        placeholder={this.props.placeholder}
        style={this.props.style}
        defaultActiveFirstOption={false}
        showArrow
        filterOption={false}
        onSearch={this.handleSearch}
        onChange={this.props.onSelect.bind(this)}
        notFoundContent={null}
        defaultValue={this.props.defaultValue || undefined}
        disabled={disabled}
        allowClear
      >
        <Option value="">All</Option>
        {this.state.data.map((p) => (
          <Option key={p._id} value={p._id}>
            <span>
              <strong>{p.username}</strong>
              {' '}
              /
              <span>{p.name || `${p.firstName} ${p.lastName}`}</span>
            </span>
          </Option>
        ))}
      </Select>
    );
  }
}
