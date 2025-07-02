import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { getNetwork, getNetworkUrl } from '@/utils/network';
import { OAuthExtension } from '@magic-ext/oauth';
import { Magic as MagicBase } from 'magic-sdk';
import { FlowExtension } from '@magic-ext/flow';
import * as fcl from '@onflow/fcl';
import showToast from '@/utils/showToast';
import Spinner from '@/components/ui/Spinner';
import { RPCError, RPCErrorCode } from 'magic-sdk';
import { saveToken, logout } from '@/utils/common';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import FormInput from '@/components/ui/FormInput';
import type { LoginProps } from '@/utils/types'; // Assuming LoginProps is defined here

// Magic Context
export type Magic = MagicBase<OAuthExtension[] & FlowExtension[]>;

type MagicContextType = {
  magic: Magic | null;
};

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
const Login = ({ token, setToken }: LoginProps) => {
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
    <div className="login-page flex items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader id="login">Login / Sign Up</CardHeader>
        <div className="p-4">
          <FormInput
            onChange={(e) => {
              if (emailError) setEmailError(false);
              setEmail(e.target.value);
            }}
            placeholder={'Enter your email'}
            value={email}
            type="email"
          />
          {emailError && <span className="text-red-500 text-sm">Enter a valid email</span>}
          <button
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 disabled:opacity-50"
            disabled={isLoginInProgress || email.length === 0}
            onClick={handleLogin}
          >
            {isLoginInProgress ? <Spinner /> : 'Continue with Email'}
          </button>
        </div>
      </Card>
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
      await logout(setToken, magic); // logout utility needs to be checked for compatibility
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
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      onClick={handleDisconnect}
      disabled={disabled}
    >
      {disabled ? <Spinner /> : 'Logout'}
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
    return <Spinner />;
  }

  return (
    <div className="p-4 bg-gray-100 rounded shadow">
      <h3 className="text-lg font-semibold">User Information</h3>
      <p><strong>Email:</strong> {userInfo.email}</p>
      <p><strong>Public Address:</strong> {userInfo.publicAddress}</p>
    </div>
  );
};


// MagicAuth component to orchestrate login/logout and user info
const MagicAuth = ({ token, setToken }: LoginProps) => {
  // This component will decide whether to show Login or UserInfo/Disconnect
  if (!token) {
    return <Login token={token} setToken={setToken} />;
  }

  // Once logged in, you might want to show user info and a disconnect button
  // For now, let's assume Disconnect button is part of Navbar or another component
  // Or, it can be rendered here:
  return (
    <div>
      {/* <UserInfo /> */}
      {/* The Disconnect button is typically in the Navbar, managed via App.tsx state */}
    </div>
  );
};

export { Login, Disconnect, UserInfo, MagicAuth };
