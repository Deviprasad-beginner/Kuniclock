import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ClockState = {
  subjectId: number | null;
  intent: string | null;
  targetDuration: number | null;
  clockMode: 'stopwatch' | 'pomodoro';
  startTime: number | null;
  isRunning: boolean;
  setSubject: (subjectId: number | null) => void;
  start: (subjectId: number, intent: string, clockMode: 'stopwatch' | 'pomodoro', targetDuration?: number | null) => void;
  stop: () => void;
  reset: () => void;
};

export const useClockStore = create<ClockState>()(
  persist(
    (set) => ({
      subjectId: null,
      intent: null,
      targetDuration: null,
      clockMode: 'stopwatch',
      startTime: null,
      isRunning: false,
      setSubject: (subjectId) => set({ subjectId }),
      start: (subjectId, intent, clockMode, targetDuration = null) => set({ subjectId, intent, clockMode, targetDuration, startTime: Date.now(), isRunning: true }),
      stop: () => set({ isRunning: false }),
      reset: () => set({ subjectId: null, intent: null, targetDuration: null, clockMode: 'stopwatch', startTime: null, isRunning: false }),
    }),
    {
      name: 'kuni-clock-storage',
    }
  )
);
