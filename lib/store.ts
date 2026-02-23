import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ClockState = {
  subjectId: number | null;
  startTime: number | null;
  isRunning: boolean;
  setSubject: (subjectId: number | null) => void;
  start: (subjectId: number) => void;
  stop: () => void;
  reset: () => void;
};

export const useClockStore = create<ClockState>()(
  persist(
    (set) => ({
      subjectId: null,
      startTime: null,
      isRunning: false,
      setSubject: (subjectId) => set({ subjectId }),
      start: (subjectId) => set({ subjectId, startTime: Date.now(), isRunning: true }),
      stop: () => set({ isRunning: false }),
      reset: () => set({ subjectId: null, startTime: null, isRunning: false }),
    }),
    {
      name: 'kuni-clock-storage',
    }
  )
);
