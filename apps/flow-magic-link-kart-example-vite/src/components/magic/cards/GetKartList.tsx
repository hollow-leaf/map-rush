import { useCallback, useEffect, useState } from 'react'
import Divider from '@/components/ui/Divider'
import { LoginProps } from '@/utils/types'
import { logout } from '@/utils/common'
import { useMagic } from '../MagicProvider'
import Card from '@/components/ui/Card'
import CardHeader from '@/components/ui/CardHeader'
import CardLabel from '@/components/ui/CardLabel'
import Spinner from '@/components/ui/Spinner'
import { getNetworkName } from '@/utils/network'
import { convertAccountBalance } from '@/utils/flowUtils'
import * as fcl from '@onflow/fcl'

interface KartNFT {
    id: string
    speed: number
    model: string
    rarity: string
}

const GetKartList = ({ token, setToken }: LoginProps) => {
    const { magic } = useMagic()

    const [balance, setBalance] = useState('...')
    const [copied, setCopied] = useState('Copy')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [kartNFTs, setKartNFTs] = useState<KartNFT[]>([])
    const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
    const [nftError, setNftError] = useState<string | null>(null)

    const [publicAddress, setPublicAddress] = useState(
        localStorage.getItem('user')
    )

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

    const getBalance = useCallback(async () => {
        if (publicAddress) {
            const account = await fcl.account(publicAddress)
            setBalance(convertAccountBalance(account.balance))
        }
    }, [magic, publicAddress])

    const refresh = useCallback(async () => {
        setIsRefreshing(true)
        await getBalance()
        await getKartNFTs()
        setTimeout(() => {
            setIsRefreshing(false)
        }, 500)
    }, [getBalance, getKartNFTs])

    useEffect(() => {
        if (magic) {
            refresh()
        }
    }, [magic, refresh])

    useEffect(() => {
        setBalance('...')
    }, [magic])

    const disconnect = useCallback(async () => {
        if (magic) {
            await logout(setToken, magic)
        }
    }, [magic, setToken])

    const copy = useCallback(() => {
        if (publicAddress && copied === 'Copy') {
            setCopied('Copied!')
            navigator.clipboard.writeText(publicAddress)
            setTimeout(() => {
                setCopied('Copy')
            }, 1000)
        }
    }, [copied, publicAddress])

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

    const getModelEmoji = (model: string) => {
        switch (model.toLowerCase()) {
            case 'car':
                return '🏎️'
            case 'motorcycle':
                return '🏍️'
            case 'bicycle':
                return '🚲'
            default:
                return '🏁'
        }
    }

    return (
        <Card>
            <CardHeader id='Kart-NFTs'>My Kart NFTs</CardHeader>
            <CardLabel
                leftHeader='Wallet Status'
                rightAction={<div onClick={disconnect}>Disconnect</div>}
                isDisconnect
            />
            <div className='flex-row'>
                <div className='green-dot' />
                <div className='connected'>Connected to {getNetworkName()}</div>
            </div>
            <Divider />
            <CardLabel
                leftHeader='Address'
                rightAction={
                    !publicAddress ? (
                        <Spinner />
                    ) : (
                        <div onClick={copy}>{copied}</div>
                    )
                }
            />
            <div className='code'>
                {publicAddress?.length == 0
                    ? 'Fetching address..'
                    : publicAddress}
            </div>
            <Divider />
            <CardLabel
                leftHeader='Balance'
                rightAction={
                    isRefreshing ? (
                        <div className='loading-container'>
                            <Spinner />
                        </div>
                    ) : (
                        <div onClick={refresh}>Refresh</div>
                    )
                }
            />
            <div className='code'>{balance} FLOW</div>
            <Divider />
            <CardLabel
                leftHeader={`Kart NFTs (${kartNFTs.length})`}
                rightAction={
                    isLoadingNFTs ? (
                        <div className='loading-container'>
                            <Spinner />
                        </div>
                    ) : (
                        <div onClick={getKartNFTs}>Refresh NFTs</div>
                    )
                }
            />
            
            {nftError && (
                <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                    Error: {nftError}
                </div>
            )}
            
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
                                    <span className="text-lg">{getModelEmoji(nft.model)}</span>
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
        </Card>
    )
}

export default GetKartList
