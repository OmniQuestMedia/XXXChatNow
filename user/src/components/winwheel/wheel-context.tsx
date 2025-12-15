import {
  createContext, useContext, useMemo, useState
} from 'react';

const WheelContext = createContext<any>({
  visibleWheel: false,
  firstClick: true,
  handleSpin: false
});

export function WheelProvider({ children = null }: any) {
  const [visibleWheel, setVisibleWheel] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [handleSpin, setHandleSpin] = useState(false);

  const onOpenSpinWheel = () => {
    if (firstClick) {
      setVisibleWheel(true);
      setFirstClick(false);
    } else {
      setHandleSpin(true);
    }
  };

  const value = useMemo(
    () => ({
      onOpenSpinWheel,
      setHandleSpin,
      visibleWheel,
      setVisibleWheel,
      setFirstClick,
      handleSpin
    }),
    [onOpenSpinWheel, handleSpin, setHandleSpin, setFirstClick, visibleWheel, setVisibleWheel]
  );

  return (
    <WheelContext.Provider value={value}>
      {children}
    </WheelContext.Provider>

  );
}

export const useWheel = () => useContext(WheelContext);
