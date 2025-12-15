import { getResponseError } from '@lib/utils';
import { message, Select } from 'antd';
import { FormInstance } from 'antd/lib/form';
import React from 'react';
import { IPerformerGallery } from 'src/interfaces';
import { galleryService } from 'src/services';

interface IProps {
  autoFocus?: boolean;
  disabled?: boolean;
  // performerId?: string;
  form?: FormInstance;
  defaultGalleryId?: string;
}

const { Option } = Select;
const filter = (value, option): boolean => option.children.toLowerCase().indexOf(value.toLowerCase()) > -1;

function Galleries({
  autoFocus = false,
  disabled = false,
  form = null,
  defaultGalleryId = ''
}: IProps) {
  const [galleries, setGalleries] = React.useState([] as IPerformerGallery[]);
  const [galleryId, setGalleryId] = React.useState(defaultGalleryId);
  const getGalleryList = async (q = '') => {
    try {
      const resp = await galleryService.search({ q });
      setGalleries(resp.data.data);
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };
  const setInputValue = (value: string) => {
    setGalleryId(value);
    form && form.setFieldsValue({ galleryId: value });
  };

  React.useEffect(() => {
    getGalleryList();
  }, []);

  return (
    <Select
      showSearch
      autoFocus={autoFocus}
      disabled={disabled}
      filterOption={filter}
      value={galleryId}
      onChange={(value) => setInputValue(value)}
      placeholder="Select your photo gallries"
    >
      {galleries.map((gallery) => (
        <Option key={gallery._id} value={gallery._id}>
          {gallery.name}
        </Option>
      ))}
    </Select>
  );
}

export default Galleries;
