import { useEffect, useRef, useState } from 'react';

// Google Identity Services 최소 타입
interface CredentialResponse { credential: string }
interface GoogleId {
  initialize(cfg: { client_id: string; callback: (r: CredentialResponse) => void; ux_mode?: 'popup'; auto_select?: boolean }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
declare global {
  interface Window { google?: { accounts: { id: GoogleId } } }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => { gisPromise = null; reject(new Error('gis load failed')); };
      document.head.appendChild(s);
    });
  }
  return gisPromise;
}

interface Props {
  clientId: string;
  onCredential: (credential: string) => void;
}

export default function GoogleLoginButton({ clientId, onCredential }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  const [failed, setFailed] = useState(false);
  useEffect(() => { cb.current = onCredential; });

  useEffect(() => {
    let cancelled = false;
    loadGis().then(() => {
      if (cancelled || !ref.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: r => cb.current(r.credential),
        ux_mode: 'popup',
        auto_select: false,
      });
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard', theme: 'filled_black', size: 'large', shape: 'rectangular',
        text: 'signin_with', logo_alignment: 'left', width: 320, locale: 'ko',
      });
    }).catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [clientId]);

  if (failed) return <p className="text-red-400 text-xs">Google 로그인 스크립트를 불러오지 못했습니다. 네트워크를 확인해주세요.</p>;
  return <div ref={ref} className="min-h-[44px] flex justify-center" />;
}
