declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (opts: {
            client_id: string;
            callback: (resp: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            opts?: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              locale?: string;
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    'script[src="https://accounts.google.com/gsi/client"]',
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('google_script_load_failed')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('google_script_load_failed'));
    document.head.appendChild(s);
  });
}

function buttonWidth(el: HTMLElement): number {
  return Math.min(380, el.clientWidth || 380);
}

export function renderGoogleContinueButton(opts: {
  container: HTMLElement;
  clientId: string;
  onCredential: (credential: string) => void;
}): void {
  if (!window.google?.accounts?.id) throw new Error('google_identity_not_ready');
  window.google.accounts.id.initialize({
    client_id: opts.clientId,
    callback: (resp) => {
      if (resp.credential) opts.onCredential(resp.credential);
    },
  });
  opts.container.innerHTML = '';
  window.google.accounts.id.renderButton(opts.container, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: buttonWidth(opts.container),
    locale: 'tr',
  });
}

/** Giriş + kayıt için iki ayrı GSI butonu (aynı OAuth akışı; metin farkı). */
export function renderGoogleSignInAndSignUpButtons(opts: {
  signInContainer: HTMLElement;
  signUpContainer: HTMLElement;
  clientId: string;
  onCredential: (credential: string) => void;
}): void {
  if (!window.google?.accounts?.id) throw new Error('google_identity_not_ready');
  window.google.accounts.id.initialize({
    client_id: opts.clientId,
    callback: (resp) => {
      if (resp.credential) opts.onCredential(resp.credential);
    },
  });
  opts.signInContainer.innerHTML = '';
  opts.signUpContainer.innerHTML = '';
  const base = {
    theme: 'outline' as const,
    size: 'large' as const,
    shape: 'rectangular' as const,
    locale: 'tr',
  };
  window.google.accounts.id.renderButton(opts.signInContainer, {
    ...base,
    text: 'signin_with',
    width: buttonWidth(opts.signInContainer),
  });
  window.google.accounts.id.renderButton(opts.signUpContainer, {
    ...base,
    text: 'signup_with',
    width: buttonWidth(opts.signUpContainer),
  });
}

