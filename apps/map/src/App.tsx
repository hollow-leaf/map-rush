import { useState, useEffect } from 'react';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet } from '@tanstack/react-router'; // Import Outlet
import { MagicProvider, Login } from '@/components/MagicAuth';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') ?? '');

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

  return (
    <MagicProvider>
      <ToastContainer />
      {token.length > 0 ? (
        <div className="flex flex-col h-[100vh] w-[100vw] overflow-hidden">
          <Navbar token={token} setToken={setToken} />
          <div className="flex-grow overflow-auto"> 
            <Outlet />
          </div>
        </div>
      ) : (
        <Login token={token} setToken={setToken} />
      )}
    </MagicProvider>
  );
}

export default App;