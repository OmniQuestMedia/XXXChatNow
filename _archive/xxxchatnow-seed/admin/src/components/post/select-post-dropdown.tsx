import { postService } from '@services/post.service';
import { Select } from 'antd';
import { sortBy } from 'lodash';
import { PureComponent } from 'react';
import { IPost } from 'src/interfaces';

const { Option } = Select;

interface IProps {
  placeholder?: string;
  style?: Record<string, string>;
  value?: any;
  defaultValue?: any;
  onSelect: (value: string, data: IPost) => void;
  disabled?: boolean;
}

export class SelectPostDropdown extends PureComponent<IProps> {
  _initalData = [];

  state = {
    data: [] as any
  };

  componentDidMount() {
    this.loadPosts();
  }

  handleSearch = (value) => {
    const q = value.toLowerCase();
    const filtered = this._initalData.filter((p) => p.slug.includes(q) || (p.title || '').toLowerCase().includes(q));
    this.setState({ data: filtered });
  };

  async loadPosts(q = '') {
    const { defaultValue } = this.props;
    const resp = await postService.search({ q, limit: 100 });
    this._initalData = sortBy(resp.data.data, (i) => i.slug);

    if (defaultValue) {
      try {
        const found = this._initalData.find((p) => p._id === defaultValue);
        if (!found) {
          const res = await postService.findById(defaultValue);
          this._initalData.push(res.data);
        }
        // eslint-disable-next-line
      } catch {}
    }

    this.setState({
      data: [...this._initalData]
    });
  }

  render() {
    const { data } = this.state;
    const {
      disabled, value, defaultValue, onSelect
    } = this.props;
    return (
      <Select
        showSearch
        value={value}
        placeholder={this.props.placeholder}
        style={this.props.style}
        defaultActiveFirstOption={false}
        showArrow
        filterOption={false}
        onSearch={this.handleSearch}
        onChange={(v) => onSelect(v, data.find((d) => d._id === v))}
        notFoundContent={null}
        defaultValue={defaultValue}
        disabled={disabled}
        allowClear
      >
        {this.state.data.map((p) => (
          <Option key={p._id} value={p._id}>
            <span>
              <strong>{p.slug}</strong>
              {' '}
              /
              <span>{p.title}</span>
            </span>
          </Option>
        ))}
      </Select>
    );
  }
}
