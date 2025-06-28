import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CallRecord {
  id: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  type: 'outgoing' | 'incoming';
  callType: 'voice' | 'video';
  timestamp: number;
  duration?: number; // in seconds
  missed: boolean;
  status: 'completed' | 'missed' | 'rejected' | 'failed';
}

interface CallState {
  calls: CallRecord[];
  addCall: (call: Omit<CallRecord, 'id' | 'timestamp'>) => string;
  updateCallDuration: (callId: string, duration: number) => void;
  updateCallStatus: (callId: string, status: CallRecord['status']) => void;
  getCallsForUser: (userId: string) => CallRecord[];
  clearCallHistory: () => void;
}

export const useCallStore = create<CallState>()(
  persist(
    (set, get) => ({
      calls: [],
      addCall: (callData) => {
        const newCall: CallRecord = {
          ...callData,
          id: Date.now().toString(),
          timestamp: Date.now(),
        };
        set((state) => ({
          calls: [newCall, ...state.calls], // Add new calls at the beginning
        }));
        return newCall.id; // Return the call ID
      },
      updateCallDuration: (callId, duration) => {
        set((state) => ({
          calls: state.calls.map((call) =>
            call.id === callId ? { ...call, duration } : call
          ),
        }));
      },
      updateCallStatus: (callId, status) => {
        set((state) => ({
          calls: state.calls.map((call) =>
            call.id === callId ? { ...call, status, missed: status === 'missed' } : call
          ),
        }));
      },
      getCallsForUser: (userId) => {
        const state = get();
        return state.calls.filter((call) => call.userId === userId);
      },
      clearCallHistory: () => {
        set({ calls: [] });
      },
    }),
    {
      name: 'call-storage',
    }
  )
); 