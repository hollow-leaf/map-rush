import React, { useState, useCallback, useEffect } from 'react';
import type { LoginProps } from '@/utils/types'
import { useMagic } from '@/components/magic/MagicProvider';
import Navbar from '@/components/Navbar';
import GetKartList from '@/components/magic/cards/GetKartList';


const MyKartList: React.FC<LoginProps> = ({ token, setToken }) => {
    const { magic } = useMagic()

    useEffect(() => {
        const checkLoginandGetBalance = async () => {
            const isLoggedIn = await magic?.user.isLoggedIn()
            if (isLoggedIn) {
                try {
                    const metadata = await magic?.user.getInfo()
                    if (metadata) {
                        localStorage.setItem('user', metadata?.publicAddress!)
                        // setPublicAddress(metadata?.publicAddress!)
                    }
                } catch (e) {
                    console.log('error in fetching address: ' + e)
                }
            }
        }
        setTimeout(() => checkLoginandGetBalance(), 5000)
    }, [])

    return (
        <div>
            <GetKartList token={token} setToken={setToken} />
        </div>
    );
};

export default MyKartList;