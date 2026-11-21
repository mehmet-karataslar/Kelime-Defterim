import { create } from 'zustand';
import { uid } from '../core/types';

export interface Toast {
  id: string;
  message: string;
  kind: 'ok' | 'err' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, kind?: Toast['kind'], actionLabel?: string, onAction?: () => void) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, kind = 'ok', actionLabel, onAction) => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, kind, actionLabel, onAction }] }));
    setTimeout(() => get().dismiss(id), actionLabel ? 5000 : 2600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, kind: Toast['kind'] = 'ok', actionLabel?: string, onAction?: () => void) =>
  useToasts.getState().show(message, kind, actionLabel, onAction);