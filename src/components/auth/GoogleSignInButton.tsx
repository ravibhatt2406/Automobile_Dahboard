import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  shape?: 'rectangular' | 'pill';
  width?: number | string;
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  text = 'signin_with',
  theme = 'outline',
  shape = 'rectangular',
  width = 320,
  onSuccess,
  onError,
}) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (response: { credential: string }) => {
    if (!response.credential) {
      const err = 'No credential returned from Google.';
      setErrorMessage(err);
      onError?.(err);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const authed = await loginWithGoogle(response.credential);
      if (onSuccess) {
        onSuccess();
      } else {
        if (authed?.customerId || authed?.customerProfile) {
          navigate('/customer/dashboard');
        } else {
          navigate('/customer/onboarding');
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Google authentication failed. Please try again.';
      setErrorMessage(msg);
      onError?.(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkOrLoadGsi = () => {
      if (window.google?.accounts?.id) {
        if (isMounted) setIsScriptReady(true);
        return;
      }

      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (isMounted) setIsScriptReady(true);
        });
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) setIsScriptReady(true);
        };
        document.head.appendChild(script);
      }
    };

    checkOrLoadGsi();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isScriptReady || !clientId || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any prior children before rendering
      buttonRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme,
        size: 'large',
        text,
        shape,
        logo_alignment: 'left',
        width: typeof width === 'number' ? width : 320,
      });
    } catch (err) {
      console.error('Failed to render Google Sign-In button:', err);
    }
  }, [isScriptReady, clientId, text, theme, shape, width]);

  if (!clientId) {
    return (
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Google Client ID is not configured in VITE_GOOGLE_CLIENT_ID.</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center space-y-2">
      {errorMessage && (
        <div className="w-full p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="leading-tight">{errorMessage}</span>
        </div>
      )}

      {isProcessing && (
        <div className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 text-white text-xs flex items-center justify-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-[#F5A800]" />
          <span>Verifying Google account with Titan Auto...</span>
        </div>
      )}

      <div
        ref={buttonRef}
        className={`w-full flex justify-center min-h-[44px] ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      />
    </div>
  );
};
