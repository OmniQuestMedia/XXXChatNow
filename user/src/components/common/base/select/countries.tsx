import { Select } from 'antd';
import React from 'react';
import { ICountry } from 'src/interfaces';

interface IProps {
  autoFocus?: boolean;
  disabled?: boolean;
  mode?: 'multiple' | 'tags';
  onChange?: Function;
  defaultValue: string;
  countries: ICountry[];
}

const { Option } = Select;

const filter = (value, option): boolean => option.children.toLowerCase().indexOf(value.toLowerCase()) > -1;

function CountriesSelect({
  defaultValue = 'US',
  countries,
  onChange = () => {},
  ...props
}: IProps) {
  const [value, setValue] = React.useState(defaultValue);
  const handleSelectChange = (v) => {
    setValue(v);
    onChange && onChange(v);
  };

  return (
    <Select
      {...props}
      value={value}
      onChange={handleSelectChange}
      showSearch
      filterOption={filter}
      placeholder="Select your counties"
    >
      {countries.map((country: ICountry) => (
        <Option key={country.code} value={country.code}>
          {country.name}
        </Option>
      ))}
    </Select>
  );
}

export default CountriesSelect;
