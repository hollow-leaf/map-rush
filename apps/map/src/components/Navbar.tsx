import React, { useState, useCallback, useEffect } from 'react';
import type { LoginProps } from '@/utils/types'
import { useMagic } from '@/components/magic/MagicProvider';
import * as fcl from '@onflow/fcl'
import { convertAccountBalance } from '@/utils/flowUtils'
import { logout } from '@/utils/common'

const Navbar: React.FC<LoginProps> = ({ token, setToken }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState('...')

  const [publicAddress, setPublicAddress] = useState(
    localStorage.getItem('user')
  )
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { magic } = useMagic()

  useEffect(() => {
    const checkLoginandGetBalance = async () => {
      const isLoggedIn = await magic?.user.isLoggedIn()
      if (isLoggedIn) {
        try {
          const metadata = await magic?.user.getInfo()
          if (metadata) {
            localStorage.setItem('user', metadata?.publicAddress!)
            setPublicAddress(metadata?.publicAddress!)
          }
        } catch (e) {
          console.log('error in fetching address: ' + e)
        }
      }
    }
    setTimeout(() => checkLoginandGetBalance(), 5000)
  }, [])

  const getBalance = useCallback(async () => {
    if (publicAddress) {
      const account = await fcl.account(publicAddress)
      setBalance(convertAccountBalance(account.balance))
    }
  }, [magic, publicAddress])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    await getBalance()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }, [getBalance])

  const disconnect = useCallback(async () => {
    if (magic) {
      await logout(setToken, magic)
    }
  }, [magic, setToken])

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">Logo</div>
        {/* Hamburger button for mobile */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
        {/* Menu for larger screens */}
        <ul className="hidden md:flex space-x-4" style={{ padding: '0px' }}>
          <li>
            <span className="text-gray-300 cursor-default">
              {publicAddress ? `${publicAddress.slice(0, 6)}...${publicAddress.slice(-4)}` : 'Not Connected'}
            </span>
          </li>
          <li><a href="#" className="hover:text-gray-400">Home</a></li>
          <li><a href="#" className="hover:text-gray-400">About</a></li>
          <li><a href="#" className="hover:text-gray-400">Contact</a></li>
        </ul>
      </div>
      {/* Collapsible menu for mobile */}
      {isOpen && (
        <div className="md:hidden mt-2">
          <ul className="flex flex-col space-y-2">
            <li>
              <span className="text-gray-300 block px-2 py-1">
                {publicAddress ? `${publicAddress.slice(0, 6)}...${publicAddress.slice(-4)}` : 'Not Connected'}
              </span>
            </li>
            <li><a href="#" className="hover:text-gray-400 block px-2 py-1">Home</a></li>
            <li><a href="#" className="hover:text-gray-400 block px-2 py-1">About</a></li>
            <li><a href="#" className="hover:text-gray-400 block px-2 py-1">Contact</a></li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
