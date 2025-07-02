import { useState, useEffect } from 'react';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet } from '@tanstack/react-router'; // Import Outlet
import { MagicProvider, Login } from '@/components/magic/MagicAuth';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') ?? '');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Update token state if localStorage changes (e.g., after login/logout)
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token') ?? '');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <MagicProvider>
      <div className="flex flex-col h-[100vh] w-[100vw] overflow-hidden">
        <Navbar token={token} setToken={setToken} toggleTheme={toggleTheme} currentTheme={theme} />
        <ToastContainer />
        {token.length > 0 ? (
            <div className="flex-grow overflow-auto"> 
              <Outlet />
            </div>
        ) : (
          <Login token={token} setToken={setToken} />
        )}
      </div>
    </MagicProvider>
  );
}

export default App;