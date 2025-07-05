import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { getNetwork, getNetworkUrl } from '@/utils/network';
import { OAuthExtension } from '@magic-ext/oauth';
import { Magic as MagicBase } from 'magic-sdk';
import { FlowExtension } from '@magic-ext/flow';
import * as fcl from '@onflow/fcl';
import showToast from '@/utils/showToast';
import { RPCError, RPCErrorCode } from 'magic-sdk';
import { saveToken, logout } from '@/utils/common';
import type { LoginProps } from '@/utils/types'; // Assuming LoginProps is defined here

// Magic Context
export type Magic = MagicBase<OAuthExtension[] & FlowExtension[]>;

type MagicContextType = {
  magic: Magic | null;
};

const Spinner = ({ className = '' }: { className?: string }) => (
  <span className={`loading loading-spinner ${className}`.trim()} />
);

const MagicContext = createContext<MagicContextType>({
  magic: null,
});

export const useMagic = () => useContext(MagicContext);

// MagicProvider Component
export const MagicProvider = ({ children }: { children: React.ReactNode }) => {
  const [magic, setMagic] = useState<Magic | null>(null);

  useEffect(() => {
    if (import.meta.env.VITE_MAGIC_API_KEY) {
      const magicInstance = new MagicBase(import.meta.env.VITE_MAGIC_API_KEY as string, {
        extensions: [
          new OAuthExtension(),
          new FlowExtension({
            rpcUrl: getNetworkUrl(),
            network: getNetwork() as string,
          }),
        ],
      });
      setMagic(magicInstance);
      fcl.config().put('accessNode.api', getNetworkUrl());
    }
  }, []);

  const value = useMemo(() => {
    return {
      magic,
    };
  }, [magic]);

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
};

// Login Component
const Login = ({ setToken }: LoginProps) => {
  const { magic } = useMagic();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [isLoginInProgress, setLoginInProgress] = useState(false);


  const handleLogin = async () => {
    if (!email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
      setEmailError(true);
    } else {
      try {
        setLoginInProgress(true);
        setEmailError(false);
        const authToken = await magic?.auth.loginWithEmailOTP({ email });
        if (authToken) {
          saveToken(authToken, setToken, 'EMAIL');
          setEmail('');
        }
      } catch (e) {
        console.log('login error: ' + JSON.stringify(e));
        if (e instanceof RPCError) {
          switch (e.code) {
            case RPCErrorCode.MagicLinkFailedVerification:
            case RPCErrorCode.MagicLinkExpired:
            case RPCErrorCode.MagicLinkRateLimited:
            case RPCErrorCode.UserAlreadyLoggedIn:
              showToast({ message: e.message, type: 'error' });
              break;
            default:
              showToast({
                message: 'Something went wrong. Please try again',
                type: 'error',
              });
          }
        }
      } finally {
        setLoginInProgress(false);
      }
    }
  };

  return (
    <div className="login-page flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary p-4">
      <div className="w-full max-w-md shadow-xl bg-base-100 rounded-xl"> {/* Card 替換 */}
        <div id="login" className="text-center text-2xl font-bold py-6">Login / Sign Up</div> {/* CardHeader 替換 */}
        <div className="p-6 space-y-4"> {/* Increased padding and added space-y */}
          <input
            onChange={(e) => {
              if (emailError) setEmailError(false);
              setEmail(e.target.value);
            }}
            placeholder={'Enter your email'}
            value={email}
            type="email"
            className="input input-bordered w-full" // DaisyUI input style
          />
          {emailError && <span className="text-error text-xs">Enter a valid email</span>}
          <button
            className="btn btn-primary w-full" // DaisyUI button style
            disabled={isLoginInProgress || email.length === 0}
            onClick={handleLogin}
          >
            {isLoginInProgress ? <Spinner className="loading loading-spinner" /> : 'Continue with Email'}
          </button>
        </div>
      </div>
    </div>
  );
};


// Disconnect Component
const Disconnect = ({ setToken }: { setToken: (token: string) => void }) => {
  const { magic } = useMagic();
  const [disabled, setDisabled] = useState(false);

  const handleDisconnect = useCallback(async () => {
    if (!magic) return;
    try {
      setDisabled(true);
      await logout(setToken as any, magic); // logout utility needs to be checked for compatibility
      setDisabled(false);
      showToast({ message: 'Logged out successfully', type: 'success' });
    } catch (error) {
      setDisabled(false);
      console.error(error);
      showToast({ message: 'Failed to logout', type: 'error' });
    }
  }, [magic, setToken]);

  return (
    <button
      className="btn btn-error" // DaisyUI button style
      onClick={handleDisconnect}
      disabled={disabled}
    >
      {disabled ? <Spinner className="loading loading-spinner" /> : 'Logout'}
    </button>
  );
};

// GetMetadata Component (Example of a user info display)
const UserInfo = () => {
  const { magic } = useMagic();
  const [userInfo, setUserInfo] = useState<any>(null); // Consider defining a type for userInfo

  const fetchMetadata = useCallback(async () => {
    if (!magic) return;
    try {
      const info = await magic.user.getInfo();
      setUserInfo(info);
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      showToast({ message: 'Failed to fetch user info', type: 'error' });
    }
  }, [magic]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  if (!userInfo) {
    // Centered spinner for better loading UX
    return (
      <div className="flex justify-center items-center p-10">
        <Spinner className="loading loading-lg" />
      </div>
    );
  }

  return (
    <div className="bg-base-100 shadow-xl p-6 my-4 w-full max-w-md mx-auto rounded-xl"> {/* Card 替換 */}
      <h3 className="text-xl font-bold mb-4">User Information</h3>
      <p className="my-1 text-sm"><strong>Email:</strong> {userInfo.email}</p>
      <p className="my-1 text-sm"><strong>Public Address:</strong> <span className="font-mono break-all">{userInfo.publicAddress}</span></p>
    </div>
  );
};


// MagicAuth component to orchestrate login/logout and user info
const MagicAuth = ({ token, setToken }: LoginProps) => {
  // This component will decide whether to show Login or UserInfo/Disconnect
  if (!token) {
    return <Login token={token} setToken={setToken} />;
  }
  return (
    <div>
      {/* <UserInfo /> */}
      {/* The Disconnect button is typically in the Navbar, managed via App.tsx state */}
    </div>
  );
};

export { Login, Disconnect, UserInfo, MagicAuth };
