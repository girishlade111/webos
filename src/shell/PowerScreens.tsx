import React, { useEffect } from 'react';
import { useThemeStore } from '../core/themeStore';
import { sound } from '../core/sound';

export const SleepScreen: React.FC = () => {
  const { osState, setOSState } = useThemeStore();

  useEffect(() => {
    if (osState !== 'sleeping') return;
    const handleWake = () => {
      sound.playClick();
      setOSState('locked');
    };
    window.addEventListener('keydown', handleWake);
    window.addEventListener('mousedown', handleWake);
    return () => {
      window.removeEventListener('keydown', handleWake);
      window.removeEventListener('mousedown', handleWake);
    };
  }, [osState, setOSState]);

  if (osState !== 'sleeping') return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black text-white/50 select-none cursor-pointer">
      <div className="text-center space-y-2">
        <p className="text-xs">WebOS is asleep</p>
        <p className="text-[10px] text-neutral-600">Click or press any key to wake</p>
      </div>
    </div>
  );
};

export const ShutdownScreen: React.FC = () => {
  const { osState, setOSState } = useThemeStore();

  useEffect(() => {
    if (osState !== 'shutdown') return;
    const handlePowerOn = () => {
      setOSState('booting');
    };
    window.addEventListener('keydown', handlePowerOn);
    window.addEventListener('mousedown', handlePowerOn);
    return () => {
      window.removeEventListener('keydown', handlePowerOn);
      window.removeEventListener('mousedown', handlePowerOn);
    };
  }, [osState, setOSState]);

  if (osState !== 'shutdown') return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black text-neutral-500 select-none cursor-pointer">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 mx-auto rounded-full border border-neutral-700 flex items-center justify-center text-neutral-600 text-lg">
          ⏻
        </div>
        <p className="text-xs font-medium text-neutral-400">WebOS has shut down</p>
        <p className="text-[10px] text-neutral-600">Click or press any key to power on</p>
      </div>
    </div>
  );
};
