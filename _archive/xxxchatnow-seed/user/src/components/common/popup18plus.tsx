/* eslint-disable react/no-danger */
import { postService } from '@services/post.service';
import { settingService } from '@services/setting.service';
import { Modal } from 'antd';
import { useEffect, useState } from 'react';

function Popup18plus() {
  const [title, setTitle] = useState('This website includes Adult content');
  const [popupContent18, setContent18] = useState('');
  const [visiblePopup18, setVisiblePopup18] = useState(false);

  const getSettingKeys = async () => {
    const metaSettings = await settingService.valueByKeys([
      'popup18ContentId',
      'popup18Enabled'
    ]);
    const { popup18ContentId, popup18Enabled } = metaSettings.data;
    if (!popup18Enabled || !popup18ContentId) return;

    const resp = await postService.findById(popup18ContentId);
    setContent18(resp.data.content);
    if (resp.data.title) setTitle(resp.data.title);
    setVisiblePopup18(true);
  };

  useEffect(() => {
    const { agree18 } = localStorage;
    if (agree18 !== 'yes') {
      getSettingKeys();
    }
  }, []);

  const handlePopup18Ok = () => {
    // set cookie / local storage and hide popup
    localStorage.setItem('agree18', 'yes');
    setVisiblePopup18(false);
  };

  const handlePopup18Cancel = () => {
    window.location.href = 'http://www.google.com';
  };

  if (!visiblePopup18 || !popupContent18) return null;

  return (
    <Modal
      width={770}
      centered
      visible={visiblePopup18}
      title={title}
      okText="I'm at least 18 years of age"
      cancelText="Take me back"
      onOk={handlePopup18Ok}
      onCancel={handlePopup18Cancel}
    >
      <div className="sun-editor-editable" dangerouslySetInnerHTML={{ __html: popupContent18 }} />
    </Modal>
  );
}

export default Popup18plus;
