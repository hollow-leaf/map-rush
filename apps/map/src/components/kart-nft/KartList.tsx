import { useEffect, useState, useCallback } from 'react';
import { useMagic } from '@/components/magic/MagicAuth'; // Updated import path for useMagic
import * as fcl from '@onflow/fcl'

interface KartNFT {
    id: string
    speed: number
    model: string
    rarity: string
}

const Spinner = () => (
    <div className='flex items-center justify-center'>
        <svg
            height='12'
            width='12'
            aria-hidden='true'
            className='w-6 h-6 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600'
            viewBox='0 0 100 101'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'>
            <path
                d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
                fill='currentColor'
            />
            <path
                d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
                fill='currentFill'
            />
        </svg>
    </div>
)

const KartList = ({ publicAddress }: { publicAddress: string | null }) => {
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

    const getRarityColor = (rarity: string) => {
        switch (rarity.toLowerCase()) {
            case 'legendary':
                return 'text-purple-600 bg-purple-100'
            case 'rare':
                return 'text-blue-600 bg-blue-100'
            case 'common':
                return 'text-green-600 bg-green-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    return (
        <>
            {
                isRefreshing ? (
                    <div className='loading-container'>
                    </div>
                ) : (
                    <div onClick={refresh}>Refresh</div>
                )
            }
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
                <div className="space-y-3 mt-3">
                    {kartNFTs.map((nft) => (
                        <div key={nft.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">{nft.model}</span>
                                    <span className="font-semibold">Kart #{nft.id}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(nft.rarity)}`}>
                                    {nft.rarity}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Speed:</span>
                                    <span className="ml-1 font-medium">{nft.speed}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Model:</span>
                                    <span className="ml-1 font-medium capitalize">{nft.model}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}

export default KartList;