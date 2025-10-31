import { Switch } from 'antd';
import { useEffect, useState } from 'react';

interface DarkModeSwitchProps {
  isDarkMode: boolean;
  onSwitchChange: (checked: boolean) => void;
}

function DarkModeSwitch({ isDarkMode, onSwitchChange }: DarkModeSwitchProps) {
  const [isSwitchOn, setIsSwitchOn] = useState(isDarkMode);

  const handleSwitch = (checked: boolean) => {
    setIsSwitchOn(checked);
    onSwitchChange(checked);

    if (checked) {
      document.body.classList.add('darkmode');
      localStorage.setItem('darkmode', 'true');
    } else {
      document.body.classList.remove('darkmode');
      localStorage.setItem('darkmode', 'false');
    }
  };

  useEffect(() => {
    setIsSwitchOn(isDarkMode);

    if (isDarkMode) {
      document.body.classList.add('darkmode');
      localStorage.setItem('darkmode', 'true');
    } else {
      document.body.classList.remove('darkmode');
      localStorage.setItem('darkmode', 'false');
    }
  }, [isDarkMode]);

  return (
    <Switch
      checked={isSwitchOn}
      onChange={handleSwitch}
      style={{ margin: '0 10px' }}
      checkedChildren="On"
      unCheckedChildren="Off"
    />
  );
}

export default DarkModeSwitch;
