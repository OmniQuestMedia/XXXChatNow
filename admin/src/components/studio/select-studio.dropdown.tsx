import { studioService } from '@services/studio.service';
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
}

export class SelectStudioDropdown extends PureComponent<IProps> {
  _initialData = [];

  state = {
    data: [] as any,
    value: undefined
  };

  componentDidMount() {
    this.loadStudios();
  }

  handleSearch = (value) => {
    const q = value.toLowerCase();
    const filtered = this._initialData.filter((p) => p.username.includes(q) || (p.name || '').toLowerCase().includes(q));
    this.setState({ data: filtered });
  };

  async loadStudios(q?: string) {
    const { defaultValue } = this.props;
    const resp = await studioService.search({ q, limit: 100 });
    this._initialData = sortBy(resp.data.data, (i) => i.username);

    if (defaultValue) {
      const found = this._initialData.find((p) => p._id === defaultValue);
      if (!found) {
        try {
          const studio = await studioService.findById(defaultValue);
          if (studio.data) this._initialData.push(studio.data);
          // eslint-disable-next-line
        } catch {}
      }
    }

    this.setState({
      data: [...this._initialData]
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
        <Option value="">All studios</Option>
        {this.state.data.map((p) => (
          <Option key={p._id} value={p._id}>
            <span>
              <strong>{p.username}</strong>
              {' '}
              /
              <span>{p.name}</span>
            </span>
          </Option>
        ))}
      </Select>
    );
  }
}
