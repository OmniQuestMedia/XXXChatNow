import { PickerConfig } from 'emoji-picker-react/dist/config/config';
import dynamic from 'next/dynamic';

let Picker;
if (typeof window !== 'undefined') {
  Picker = dynamic(() => import('emoji-picker-react'), { ssr: false });
}

interface IProps extends PickerConfig {
  handleEmojiClick: Function;
}

export default function Emotions({
  handleEmojiClick
}: IProps) {
  const onEmojiClickHandler = (emoji) => {
    handleEmojiClick(emoji);
  };

  return (
    <Picker
      onEmojiClick={onEmojiClickHandler}
      disableAutoFocus
      disableSearchBar
      disableSkinTonePicker
    />
  );
}
