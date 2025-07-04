import { useEffect, useState, useCallback } from 'react';
import { useMagic } from '@/components/magic/MagicAuth'; // Updated import path for useMagic
import * as fcl from '@onflow/fcl'
import BabylonScene from '../BabylonScene';
import Spinner from '@/components/ui/Spinner';

interface KartNFT {
    id: string
    speed: number
    model: string
    rarity: string
}

interface KartsProps {
    nft: KartNFT;
}

const NFTCard: React.FC<KartsProps> = ({ nft }) => {
    const getRarityColor = (rarity: string) => {
        switch (rarity.toLowerCase()) {
            case 'legendary':
                return 'text-purple-300 bg-purple-900/50 border border-purple-400';
            case 'rare':
                return 'text-blue-300 bg-blue-900/50 border border-blue-400';
            case 'common':
                return 'text-green-300 bg-green-900/50 border border-green-400';
            default:
                return 'text-gray-300 bg-gray-900/50 border border-gray-400';
        }
    };

    const getRarityGradient = (rarity: string) => {
        switch (rarity.toLowerCase()) {
            case 'legendary':
                return 'from-purple-800 via-indigo-900 to-black';
            case 'rare':
                return 'from-blue-800 via-cyan-900 to-black';
            case 'common':
                return 'from-green-800 via-teal-900 to-black';
            default:
                return 'from-gray-800 via-neutral-900 to-black';
        }
    };


    return (
        <div className="flex-shrink-0 w-72 h-96 rounded-2xl overflow-hidden shadow-2xl group m-4 transition-all duration-500 ease-in-out transform hover:scale-105 hover:shadow-purple-500/50">
            <div className={`relative w-full h-full bg-gradient-to-br ${getRarityGradient(nft.rarity)}`}>
                {/* 3D Model Scene */}
                <div className="absolute inset-0 z-10 h-2/3">
                    <BabylonScene modelUrl={nft.model} />
                </div>

                {/* Info Panel */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 p-5 bg-black/30 backdrop-blur-lg text-white rounded-t-xl z-20 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-shadow truncate">Kart #{nft.id}</h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRarityColor(nft.rarity)} flex-shrink-0`}>
                                {nft.rarity}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-md font-semibold text-shadow">Speed: <span className="font-bold text-xl">{nft.speed}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KartCollection = ({ publicAddress }: { publicAddress: string | null }) => {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [kartNFTs, setKartNFTs] = useState<KartNFT[]>([])
    const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
    const [nftError, setNftError] = useState<string | null>(null)

    const { magic } = useMagic(); // Still might need magic for user-specific data

    // Cadence script to get user's Kart NFTs
    const getKartNFTsScript = `
        import Kart from 0xe30b5ab6820d3e32

        access(all) fun main(userAddress: Address): [{String: AnyStruct}] {
            let account = getAccount(userAddress)
            let collectionRef = account.capabilities.borrow<&Kart.Collection>(Kart.CollectionPublicPath)
            
            if collectionRef == nil {
                return []
            }
            
            let collection = collectionRef!
            let ids = collection.getIDs()
            let nftData: [{String: AnyStruct}] = []
            
            for id in ids {
                if let nft = collection.borrowKartNFT(id: id) {
                    let rarity = nft.getSpeedRarity()
                    nftData.append({
                        "id": id.toString(),
                        "speed": nft.speed,
                        "model": nft.model,
                        "rarity": rarity
                    })
                }
            }
            
            return nftData
        }
    `

    const getKartNFTs = useCallback(async () => {
        if (!publicAddress) return

        setIsLoadingNFTs(true)
        setNftError(null)

        try {
            // Configure FCL for testnet
            fcl.config({
                'accessNode.api': 'https://rest-testnet.onflow.org',
                'flow.network': 'testnet'
            })

            const result = await fcl.query({
                cadence: getKartNFTsScript,
                args: (arg: any, t: any) => [
                    arg(publicAddress, t.Address)
                ]
            })

            console.log('Kart NFTs result:', result)

            if (Array.isArray(result)) {
                const nfts: KartNFT[] = result.map((nft: any) => ({
                    id: nft.id || '',
                    speed: parseInt(nft.speed) || 0,
                    model: nft.model || '',
                    rarity: nft.rarity || ''
                }))
                setKartNFTs(nfts)
            } else {
                setKartNFTs([])
            }
        } catch (err) {
            console.error('Error fetching Kart NFTs:', err)
            setNftError(err instanceof Error ? err.message : 'Failed to fetch NFTs')
            setKartNFTs([])
        } finally {
            setIsLoadingNFTs(false)
        }
    }, [publicAddress, getKartNFTsScript])

    const refresh = useCallback(async () => {
        setIsRefreshing(true)
        await getKartNFTs()
        setTimeout(() => {
            setIsRefreshing(false)
        }, 500)
    }, [getKartNFTs])

    useEffect(() => {
        if (magic) {
            refresh()
        }
    }, [magic, refresh])

    return (
        <>
            <div className="flex justify-between items-center mt-8 mb-4">
                <h1 className="text-2xl font-bold">My Kart Collection</h1>
                <button
                    onClick={refresh}
                    disabled={isRefreshing || isLoadingNFTs}
                    className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                    {isRefreshing ? (
                        <>
                            <Spinner />
                            <span className="ml-2">Refreshing...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            <span>Refresh</span>
                        </>
                    )}
                </button>
            </div>
            {isLoadingNFTs ? (
                <div className="flex justify-center items-center py-4">
                    <Spinner />
                    <span className="ml-2">Loading NFTs...</span>
                </div>
            ) : kartNFTs.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                    No Kart NFTs found in this wallet
                </div>
            ) : (
                <div className="flex overflow-x-auto pb-4">
                    {kartNFTs.map((nft) => (
                        <NFTCard key={nft.id} nft={nft} />
                    ))}
                </div>
            )}
        </>
    )
}

export default KartCollection;
