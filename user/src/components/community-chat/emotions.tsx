import dynamic from 'next/dynamic';

let Picker;
if (typeof window !== 'undefined') {
  Picker = dynamic(() => import('emoji-picker-react'), { ssr: false });
}

interface IProps {
  onEmojiClick: Function;
}

export default function Emotions({
  onEmojiClick
}: IProps) {
  const onEmojiClickHandler = (emoji) => {
    onEmojiClick(emoji);
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
