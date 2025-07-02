import React, { useState, useCallback, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import type { LoginProps } from '@/utils/types';
import { useMagic, Disconnect, UserInfo } from '@/components/magic/MagicAuth'; // Updated import
import * as fcl from '@onflow/fcl';
import { convertAccountBalance } from '@/utils/flowUtils';

interface NavbarProps extends LoginProps {
  toggleTheme: () => void;
  currentTheme: string;
}

const Navbar: React.FC<NavbarProps> = ({ token, setToken, toggleTheme, currentTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState('...');
  const [publicAddress, setPublicAddress] = useState<string | null>(localStorage.getItem('user'));
  const [userEmoji, setUserEmoji] = useState('👤'); // Default emoji

  const { magic } = useMagic();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (magic && token) {
        try {
          const metadata = await magic.user.getInfo();
          if (metadata?.publicAddress) {
            localStorage.setItem('user', metadata.publicAddress);
            setPublicAddress(metadata.publicAddress);
            // Placeholder for emoji logic - can be expanded
            if (metadata.email?.startsWith('a')) setUserEmoji('😊');
            else setUserEmoji('😎');
          }
        } catch (e) {
          console.log('error in fetching address: ' + e);
        }
      }
    };
    fetchUserInfo();
  }, [magic, token]);

  const getBalance = useCallback(async () => {
    if (publicAddress) {
      try {
        const account = await fcl.account(publicAddress);
        setBalance(convertAccountBalance(account.balance));
      } catch (error) {
        console.error("Failed to get balance:", error);
        setBalance('N/A');
      }
    }
  }, [publicAddress]);

  useEffect(() => {
    if (token) {
      getBalance();
    }
  }, [token, getBalance]);


  return (
    <nav className="navbar bg-base-100 shadow-md">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl">
          KartApp 🏎️
        </Link>
      </div>

      <div className="navbar-end">
        {/* Theme Toggle */}
        <button className="btn btn-ghost btn-circle" onClick={toggleTheme}>
          {currentTheme === 'light' ? '🌙' : '☀️'}
        </button>

        {token ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                {/* Placeholder for actual image, using emoji for now */}
                <span className="text-2xl">{userEmoji}</span>
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <span className="justify-between">
                  Profile
                  <span className="badge"> {publicAddress ? `${publicAddress.slice(0, 4)}...${publicAddress.slice(-3)}` : 'N/A'}</span>
                </span>
              </li>
              <li><a>Flow Balance: {balance}</a></li>
              <li><Link to="/my-kart-list">My Karts</Link></li>
              <li><a onClick={() => getBalance()}>Refresh Balance</a></li>
              <li>
                <Disconnect setToken={setToken} />
              </li>
            </ul>
          </div>
        ) : (
          <Link to="/about" className="btn btn-ghost"> 
            {/* Changed to /about which is the implicit login route by tanstack router, or adjust as needed */}
            Login
          </Link>
        )}

        {/* Mobile Menu Button - DaisyUI handles this, but we can customize if needed */}
        <div className="dropdown dropdown-end md:hidden">
          <label tabIndex={0} className="btn btn-ghost md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            {/* Replicate links for mobile if not covered by the user dropdown */}
            {!token && <li><Link to="/about">Login</Link></li>}
            <li><button onClick={toggleTheme}>{currentTheme === 'light' ? 'Dark Mode' : 'Light Mode'}</button></li>
            {/* Add other mobile-specific links if necessary */}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
