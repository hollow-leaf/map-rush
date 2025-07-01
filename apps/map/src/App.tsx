import { useRef, useState, useCallback, useEffect } from 'react';
import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import { Routes, Route } from 'react-router-dom';
import MyKartList from './pages/MyKartList';
import Home from './pages/Home';
import MagicProvider from '@/components/magic/MagicProvider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from '@/components/magic/Login'
import MagicDashboardRedirect from '@/components/magic/MagicDashboardRedirect'
import Navbar from './components/Navbar';

function App() {
  const [token, setToken] = useState('')

  useEffect(() => {
    setToken(localStorage.getItem('token') ?? '')
  }, [setToken])

  return (
    <MagicProvider>
      <ToastContainer />
      {import.meta.env.VITE_MAGIC_API_KEY ? (
        token.length > 0 ? (
          <div className="flex flex-col h-[100vh] w-[100vw] overflow-hidden">
            <Navbar token={token} setToken={setToken} />
            <Routes>
              <Route path="/" element={<Home token={token} setToken={setToken} />} />
              <Route path="/my-kart-list" element={<MyKartList token={token} setToken={setToken} />} />
            </Routes>
          </div>
        ) : (
          <Login token={token} setToken={setToken} />
        )
      ) : (
        <MagicDashboardRedirect />
      )}
    </MagicProvider>
  )
}

export default App