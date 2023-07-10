import { atom } from 'recoil';
import { ExecutionRecorder } from '@ironclad/rivet-core';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({ key: 'execution' });

export const remoteUploadAllowedState = atom<boolean>({
  key: 'remoteUploadAllowed',
  default: false,
});

export const selectedExecutorState = atom<'browser' | 'node'>({
  key: 'selectedExecutor',
  default: 'browser',
});

export type RemoteDebuggerState = {
  socket: WebSocket | null;
  started: boolean;
  reconnecting: boolean;
  url: string;
  remoteUploadAllowed: boolean;
  isInternalExecutor: boolean;
};

export const remoteDebuggerState = atom<RemoteDebuggerState>({
  key: 'remoteDebuggerState',
  default: {
    socket: null,
    started: false,
    reconnecting: false,
    url: '',
    remoteUploadAllowed: false,
    isInternalExecutor: false,
  },
  effects_UNSTABLE: [persistAtom],
});

export const loadedRecordingState = atom<{
  path: string;
  recorder: ExecutionRecorder;
} | null>({
  key: 'loadedRecording',
  default: null,
});

export const lastRecordingState = atom<string | undefined>({
  key: 'lastRecording',
  default: undefined,
});
