import { useState } from 'react';
import { SketchPicker } from 'react-color';

import s from './color-picker.module.less';

interface Props {
  defaultValue: string;
  onChange: any;
}

export function ColorPicker({ defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const handleChange = (color) => {
    setValue(color);
    onChange(color);
  };

  return (
    <SketchPicker
      className={s.colorPicker}
      color={value}
      onChangeComplete={handleChange}
    />
  );
}
