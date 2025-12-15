import { FilterOutlined } from '@ant-design/icons';
import {
  Button, Col, Drawer, Menu, Row, Space
} from 'antd';
import classnames from 'classnames';
import { useState } from 'react';
import { ICountry } from 'src/interfaces';
import { IAggregatorCategogiesModel } from 'src/interfaces/aggregator-categories';

import style from './cam-aggregator-filter.module.less';

interface IProps {
  categories?: IAggregatorCategogiesModel[];
  gender?: string;
  category?: string;
  country?: string;
  setFilter: Function;
  countries?: ICountry[];
  clearFilter: () => void;
}

function AggregatorFilter({
  categories = [],
  setFilter = () => { },
  countries = [],
  category = '',
  country = '',
  gender = '',
  clearFilter = () => { }
}: IProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Row align="middle" className={style['performer-filter']} justify="space-between">
        <Col>
          <Button
            icon={<FilterOutlined />}
            type="primary"
            onClick={() => setVisible(true)}
            className="mr-8"
          >
            Filter
          </Button>
          <Space className="ant-space-wrap">
            <span style={{ fontWeight: 'bold' }}>Popular Filter:</span>
            <Button
              onClick={clearFilter}
              className={classnames(gender === '' ? 'active' : '')}
              type="dashed"
            >
              Couples
            </Button>
            <Button
              onClick={() => setFilter('gender', gender === 'female' ? '' : 'female')}
              className={classnames(gender === 'female' ? 'active' : '')}
              type="dashed"
            >
              Female
            </Button>
            <Button
              onClick={() => setFilter('gender', gender === 'transgender' ? '' : 'transgender')}
              className={classnames(gender === 'transgender' ? 'active' : '')}
              type="dashed"
            >
              Trans
            </Button>
            <Button
              onClick={() => setFilter('gender', gender === 'male' ? '' : 'male')}
              className={classnames(gender === 'male' ? 'active' : '')}
              type="dashed"
            >
              Male
            </Button>
          </Space>
        </Col>
      </Row>
      <Drawer
        visible={visible}
        placement="left"
        onClose={() => setVisible(false)}
        title={(
          <Row justify="space-between" align="middle">
            <Col>Filter by:</Col>
            <Col>
              <Button
                type="link"
                onClick={() => clearFilter()}
                size="small"
                style={{ marginRight: 10 }}
              >
                Clear Filter
              </Button>
            </Col>
          </Row>
        )}
      >
        {/* Select multiple category */}
        {categories.length > 0 && (
          <Menu
            mode="inline"
            style={{ borderRight: 0 }}
            multiple={false}
            onSelect={({ key }) => setFilter('category', key !== 'All' ? key : '')}
            onDeselect={() => setFilter('category', '')}
            selectedKeys={[category]}
          >
            <Menu.SubMenu title="Category" key="category">
              <Menu.Item key="All">All</Menu.Item>
              {categories.map((c) => (
                <Menu.Item key={c.alias}>
                  <a onClick={(e) => e.preventDefault()} href={`/cams-aggregator/category/${c.alias}`}>
                    {c.name}
                  </a>
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          </Menu>
        )}
        <Menu
          mode="inline"
          style={{ borderRight: 0 }}
          onSelect={({ key }) => setFilter('gender', key)}
          onDeselect={() => setFilter('gender', '')}
          selectedKeys={[gender]}
        >
          <Menu.SubMenu title="Gender" key="gender">
            <Menu.Item key="female">Female</Menu.Item>
            <Menu.Item key="transgender">Transgender</Menu.Item>
            <Menu.Item key="male">Male</Menu.Item>
          </Menu.SubMenu>
        </Menu>
        {countries.length > 0 && (
          <Menu
            mode="inline"
            style={{ borderRight: 0 }}
            multiple={false}
            onSelect={({ key }) => setFilter('country', key !== 'All' ? key : '')}
            onDeselect={() => setFilter('country', '')}
            selectedKeys={[country]}
          >
            <Menu.SubMenu title="Country" key="country">
              <Menu.Item key="All">All</Menu.Item>
              {countries.map((c) => (
                <Menu.Item key={c.code}>{c.name}</Menu.Item>
              ))}
            </Menu.SubMenu>
          </Menu>
        )}
      </Drawer>
    </>
  );
}

export default AggregatorFilter;
