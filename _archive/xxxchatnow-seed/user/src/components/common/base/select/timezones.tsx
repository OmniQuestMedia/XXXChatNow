import { getResponseError } from '@lib/utils';
import { IResponse } from '@services/api-request';
import { message, Select } from 'antd';
import React from 'react';
import { utilsService } from 'src/services';

interface IProps {
  autoFocus?: boolean;
  disabled?: boolean;
}

const { Option } = Select;
const filter = (value, option): boolean => option.children.toLowerCase().indexOf(value.toLowerCase()) > -1;
function TimezonesSelect({ ...props }: IProps) {
  const [timezones, setTimezones] = React.useState([]);
  React.useEffect(() => {
    const getTimezoneList = async () => {
      try {
        const resp: IResponse<string[]> = await utilsService.getTimezones();
        setTimezones(resp.data);
      } catch (e) {
        const err = await Promise.resolve(e);
        message.error(getResponseError(err));
      }
    };
    getTimezoneList();
  }, []);
  return (
    <Select
      {...props}
      showSearch
      filterOption={filter}
      placeholder="Select your timezone"
    >
      {timezones.length > 0
        && timezones.map((zone) => (
          <Option key={zone} value={zone}>
            {zone}
          </Option>
        ))}
    </Select>
  );
}

export default TimezonesSelect;
