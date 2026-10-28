import React, { useEffect, useState, useRef } from 'react';
import { UserAccount, SubscriptionState, isSubscriptionPro } from '../domain/subscription';
import { LogOut, RefreshCw, Sparkles } from 'lucide-react';

interface GoogleLoginButtonProps {
  user: UserAccount | null;
  subscription: SubscriptionState;
  onLoginSuccess: (user: UserAccount, sub?: SubscriptionState) => void;
  onLogout: () => void;
  onSyncRequest?: () => Promise<void>;
  isSyncing?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  user,
  subscription,
  onLoginSuccess,
  onLogout,
  onSyncRequest,
  isSyncing = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [gisRendered, setGisRendered] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    '407408718192.apps.googleusercontent.com';

  const isRealGoogleConfigured = Boolean(googleClientId && googleClientId.includes('-'));

  useEffect(() => {
    if (user || !isRealGoogleConfigured) return;

    const setupGoogleIdentity = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });

          // Render official Google button into DOM
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'medium',
            type: 'standard',
            shape: 'pill',
            text: 'signin_with',
            locale: 'th'
          });

          setGisRendered(true);
        } catch {
          setGisRendered(false);
        }
      }
    };

    setupGoogleIdentity();
    const interval = setInterval(() => {
      if (!gisRendered && window.google?.accounts?.id) {
        setupGoogleIdentity();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, googleClientId, gisRendered, isRealGoogleConfigured]);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onLoginSuccess(data.user, data.subscription);
          return;
        }
      }
    } catch {
      // Fallback decode
    }

    // Client-side fallback parsing
    try {
      const parts = response.credential.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const fallbackUser: UserAccount = {
        id: payload.sub || `google-${Date.now()}`,
        email: payload.email || 'user@example.com',
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture
      };
      onLoginSuccess(fallbackUser);
    } catch {
      // ignore
    }
  };

  const handleDemoLogin = () => {
    const demoUser: UserAccount = {
      id: 'usr_freelance_' + Math.random().toString(36).substring(2, 8),
      email: 'freelancer.pro@gmail.com',
      name: 'วรวิทย์ พัฒนาเว็บ (Freelancer)',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    };
    onLoginSuccess(demoUser);
  };

  const handleSyncClick = async () => {
    if (onSyncRequest) {
      setSyncStatusMsg('กำลังซิงค์...');
      await onSyncRequest();
      setSyncStatusMsg('ซิงค์เรียบร้อย!');
      setTimeout(() => setSyncStatusMsg(null), 2500);
    }
  };

  if (user) {
    return (
      <div className="relative inline-block text-left">
        <div className="flex items-center gap-2">
          {onSyncRequest && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              title="ซิงค์ข้อมูลกับคลาวด์"
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">{syncStatusMsg || 'ซิงค์คลาวด์'}</span>
            </button>
          )}

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-medium text-slate-700 max-w-[100px] sm:max-w-[120px] truncate">
              {user.name}
            </span>
            {isSubscriptionPro(subscription) && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <Sparkles className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                PRO
              </span>
            )}
          </button>
        </div>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">สถานะแพ็กเกจ</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  subscription.tier === 'pro'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {subscription.tier === 'pro' ? 'Pro Member' : 'Free Tier'}
                </span>
              </div>
            </div>

            <div className="px-2 py-1">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleGoogleClick = () => {
    if (!isRealGoogleConfigured) {
      alert('ยังไม่ได้ระบุ Google OAuth Client ID จริงในระบบ (VITE_GOOGLE_CLIENT_ID)\nระบบจะเข้าสู่ระบบด้วยบัญชีทดลอง (Demo Account) ให้คุณทันที');
      handleDemoLogin();
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      {/* Demo Account Button: Always visible alongside Google */}
      <button
        onClick={handleDemoLogin}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-200/90 rounded-lg shadow-2xs transition-all hover:border-amber-300 cursor-pointer shrink-0"
        title="เข้าสู่ระบบทดลอง (Demo) ทันทีโดยไม่ต้องใช้ Google Account"
      >
        <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
        <span className="hidden sm:inline">บัญชีทดลอง</span>
        <span className="sm:hidden text-[10px]">Demo</span>
      </button>

      {/* Official Google GIS Button Container (if real client ID is configured and GIS loaded) */}
      {isRealGoogleConfigured && (
        <div ref={googleBtnRef} className={gisRendered ? "h-9 flex items-center" : "hidden"} />
      )}

      {/* Google Button (Fallback or when GIS is not active / unconfigured) */}
      {(!isRealGoogleConfigured || !gisRendered) && (
        <button
          onClick={handleGoogleClick}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-all hover:border-slate-400 cursor-pointer shrink-0"
          title="เข้าสู่ระบบด้วย Google Account"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="hidden sm:inline">Google</span>
          <span className="sm:hidden text-[10px] font-medium">Google</span>
        </button>
      )}
    </div>
  );
};
