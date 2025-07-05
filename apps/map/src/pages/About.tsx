import React, { useEffect } from 'react';
import { useMagic } from '@/components/magic/MagicAuth'; // Updated import path for useMagic

const KartListComponent = () => {
    return <div className="p-4">My Karts will be listed here.</div>;
}

const About: React.FC = () => {
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
                    console.log('Error fetching user info in MyKartList: ' + e);
                }
            }
        };
        fetchUserInfo();
    }, [magic]); // Rerun if magic instance changes

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mt-8 mb-4">My Kart Collection</h1> {/* Add margin top for separation */}
            <KartListComponent />
        </div>
    );
};

export default About;