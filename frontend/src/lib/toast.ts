export type ToastKind = 'error' | 'info';
export const TOAST_EVENT = 'app:toast';

/** 어디서든 호출 가능한 토스트 (Toaster 컴포넌트가 표시) */
export function toast(text: string, kind: ToastKind = 'info') {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { text, kind } }));
}
