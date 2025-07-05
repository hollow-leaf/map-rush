import React, { useEffect } from 'react';
import { useMagic } from '@/components/magic/MagicAuth'; // Updated import path for useMagic
import KartCollection from '@/components/kart-nft/KartCollection';
import KartWorkshop from '@/components/kart-nft/KartWorkshop';

const KartGarage: React.FC = () => {
    const { magic } = useMagic(); // Still might need magic for user-specific data

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (magic && await magic.user.isLoggedIn()) {
                try {
                    const metadata = await magic.user.getInfo();
                    if (metadata?.publicAddress) {
                        localStorage.setItem('user', metadata.publicAddress);
                        // Potentially trigger a state update if publicAddress is used directly in this component's render
                    }
                } catch (e) {
                    console.log('Error fetching user info in KartGarage: ' + e);
                }
            }
        };
        fetchUserInfo();
    }, [magic]); // Rerun if magic instance changes

    return (
        <div className="container mx-auto p-4">
            <KartWorkshop />
            <KartCollection publicAddress={localStorage.getItem('user')} />
        </div>
    );
};

export default KartGarage;