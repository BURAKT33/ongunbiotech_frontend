import React, { useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Leaf, LogIn, UserPlus } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  formatFirebaseAuthError,
  isLikelyNewFirebaseAccount,
  registerWithEmailPassword,
  signInFirebaseWithGoogleIdToken,
  signInWithEmailPasswordLogin,
} from '../lib/firebaseAuth';
import { upsertFirestoreUser } from '../lib/firestoreUsers';
import {
  markAccountWithoutPlantDemo,
  setStoredRole,
  setStoredUserProfile,
  type UserRole,
} from '../lib/session';
import { getGoogleWebClientId } from '../lib/googleWebClientId';
import { loadGoogleIdentityScript, renderGoogleContinueButton } from '../lib/googleIdentity';
import { postGoogleCredential } from '../lib/authApi';

type AuthMode = 'login' | 'register';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginRole: UserRole = useMemo(
    () => (searchParams.get('rol') === 'muhendis' ? 'muhendis' : 'ciftci'),
    [searchParams],
  );

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleBtnLoading, setGoogleBtnLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const isEngineer = loginRole === 'muhendis';

  const finishSessionAndNavigate = async (opts: {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
  }) => {
    const role = opts.role;
    setStoredRole(role);
    setStoredUserProfile({
      uid: opts.uid,
      email: opts.email,
      displayName: opts.displayName,
      role,
    });
    if (isFirebaseConfigured()) {
      await upsertFirestoreUser(opts.uid, {
        email: opts.email,
        displayName: opts.displayName,
        role,
      });
    }
    navigate('/panel');
  };

  const handleGoogleCredential = async (credential: string) => {
    setGoogleError(null);
    setGoogleBusy(true);
    try {
      const result = await postGoogleCredential(credential, loginRole);
      if (!result.ok) {
        setGoogleError(result.error);
        return;
      }
      const roleFromServer = result.user.role;
      const role = roleFromServer === 'muhendis' ? 'muhendis' : 'ciftci';
      const name = result.user.name ?? result.user.email?.split('@')[0] ?? 'Kullanıcı';
      const em = result.user.email ?? '';

      if (isFirebaseConfigured()) {
        /* fetchSignInMethodsForEmail, enumeration koruması açıkken [] döner — girişi yanlış engeller. */
        const fbUser = await signInFirebaseWithGoogleIdToken(credential);
        if (!fbUser) {
          setGoogleError('Firebase Google oturumu açılamadı (Authentication → Google açık olmalı).');
          return;
        }
        if (isLikelyNewFirebaseAccount(fbUser)) {
          markAccountWithoutPlantDemo(fbUser.uid);
        }
        await finishSessionAndNavigate({
          uid: fbUser.uid,
          email: em || fbUser.email || '',
          displayName: name,
          role,
        });
      } else {
        setStoredRole(role);
        setStoredUserProfile({
          uid: result.user.id,
          email: em,
          displayName: name,
          role,
        });
        navigate('/panel');
      }
    } catch (e) {
      setGoogleError((e as Error).message || 'google_login_failed');
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleGoogleCredentialRef = useRef(handleGoogleCredential);
  handleGoogleCredentialRef.current = handleGoogleCredential;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoginError(null);

    const defaultDisplayName =
      displayName.trim() || email.split('@')[0] || 'Kullanıcı';

    if (authMode === 'register') {
      if (password !== confirmPassword) {
        setLoginError('Şifreler eşleşmiyor.');
        return;
      }
      if (password.length < 6) {
        setLoginError('Şifre en az 6 karakter olmalı.');
        return;
      }
    }

    if (!isFirebaseConfigured()) {
      setLoginError('Güvenli giriş ve kayıt için Firebase yapılandırması gerekli (VITE_FIREBASE_*).');
      return;
    }

    try {
      if (authMode === 'register') {
        const user = await registerWithEmailPassword(email, password, defaultDisplayName);
        markAccountWithoutPlantDemo(user.uid);
        const em = user.email || email;
        const name = user.displayName || defaultDisplayName;
        await finishSessionAndNavigate({
          uid: user.uid,
          email: em,
          displayName: name,
          role: loginRole,
        });
      } else {
        const user = await signInWithEmailPasswordLogin(email, password);
        const em = user.email || email;
        const name = user.displayName || em.split('@')[0] || 'Kullanıcı';
        await finishSessionAndNavigate({
          uid: user.uid,
          email: em,
          displayName: name,
          role: loginRole,
        });
      }
    } catch (err) {
      setLoginError(formatFirebaseAuthError(err));
    }
  };

  const googleClientId = getGoogleWebClientId();

  useLayoutEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!googleClientId) return;
      setGoogleBtnLoading(true);
      setGoogleError(null);
      try {
        for (let i = 0; i < 12 && !googleBtnRef.current; i++) {
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
        }
        if (cancelled) return;
        if (!googleBtnRef.current) {
          setGoogleError('google_button_mount_failed');
          return;
        }
        await loadGoogleIdentityScript();
        if (cancelled || !googleBtnRef.current) return;
        renderGoogleContinueButton({
          container: googleBtnRef.current,
          clientId: googleClientId,
          onCredential: (cred) => {
            void handleGoogleCredentialRef.current(cred);
          },
        });
      } catch (e) {
        setGoogleError((e as Error).message || 'google_script_failed');
      } finally {
        if (!cancelled) setGoogleBtnLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
      googleBtnRef.current?.replaceChildren();
    };
  }, [googleClientId, loginRole]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">PlantSignal</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEngineer ? 'Mühendis Paneli' : 'Çiftçi Paneli'}
          </h1>
          <p className="text-gray-600">
            {isEngineer
              ? 'Bağlı çiftçilerin raporlarını ve sahadaki ölçümlerinizi yönetin'
              : 'Bitkilerinizi izlemek için giriş yapın veya kayıt olun'}
          </p>
          {isFirebaseConfigured() && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mt-3">
              Firebase bağlı. Kayıt / giriş sonrası kullanıcı bilgileri Firestore&apos;da{' '}
              <strong>users</strong> koleksiyonuna yazılır; Google veya e-posta ile kayıt Auth&apos;ta
              oluşur.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                authMode === 'login'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Giriş
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setLoginError(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                authMode === 'register'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kayıt ol
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs text-center text-gray-500 font-medium">
              Google ile giriş veya ilk kez kayıt
            </p>
            <div
              className={`min-h-[44px] w-full flex justify-center items-center ${
                googleBusy ? 'opacity-70 pointer-events-none' : ''
              }`}
              ref={googleBtnRef}
            />
            {googleBtnLoading && (
              <p className="text-xs text-center text-gray-500">Google yükleniyor…</p>
            )}
            {googleError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Google: {googleError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400">veya e-posta</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>
          </div>

          {loginError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {loginError}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {authMode === 'register' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Ad soyad <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                  placeholder="Ahmet Yılmaz"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                placeholder={isEngineer ? 'muhendis@firma.com' : 'ornek@ciftlik.com'}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre tekrar
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {authMode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
                  />
                  <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
                </label>
                <span className="text-sm text-gray-400">Şifre sıfırlama: Firebase Console</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {authMode === 'register' ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Kayıt ol
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Giriş yap
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Ana sayfaya dön
          </a>
        </div>
      </div>
    </div>
  );
}
