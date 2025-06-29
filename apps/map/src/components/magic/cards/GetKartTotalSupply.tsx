import { useCallback, useEffect, useState } from 'react'
import Divider from '@/components/ui/Divider'
import { LoginProps } from '@/utils/types'
import { useMagic } from '../MagicProvider'
import Card from '@/components/ui/Card'
import CardHeader from '@/components/ui/CardHeader'
import CardLabel from '@/components/ui/CardLabel'
import Spinner from '@/components/ui/Spinner'
import * as fcl from '@onflow/fcl'

interface SupplyInfo {
    totalSupply: number
    maxSupply: number
    remainingSupply: number
    canMint: boolean
}

const GetKartTotalSupply = () => {
    const { magic } = useMagic()

    const [supplyInfo, setSupplyInfo] = useState<SupplyInfo | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [supplyError, setSupplyError] = useState<string | null>(null)

    // Cadence script to get Kart supply information
    const getSupplyInfoScript = `
        import Kart from 0xe30b5ab6820d3e32

        access(all) fun main(): {String: UInt64} {
            return {
                "maxSupply": Kart.maxSupply,
                "totalSupply": Kart.totalSupply,
                "remainingSupply": Kart.getRemainingSupply(),
                "canMint": Kart.canMint() ? 1 : 0
            }
        }
    `

    const getSupplyInfo = useCallback(async () => {
        setIsRefreshing(true)
        setSupplyError(null)

        try {
            // Configure FCL for testnet
            fcl.config({
                'accessNode.api': 'https://rest-testnet.onflow.org',
                'flow.network': 'testnet'
            })

            const result = await fcl.query({
                cadence: getSupplyInfoScript
            })

            console.log('Supply info result:', result)

            if (result && typeof result === 'object') {
                const info: SupplyInfo = {
                    totalSupply: parseInt(result.totalSupply || '0'),
                    maxSupply: parseInt(result.maxSupply || '0'),
                    remainingSupply: parseInt(result.remainingSupply || '0'),
                    canMint: parseInt(result.canMint || '0') === 1
                }
                setSupplyInfo(info)
            }
        } catch (err) {
            console.error('Error fetching supply info:', err)
            setSupplyError(err instanceof Error ? err.message : 'Failed to fetch supply info')
        } finally {
            setIsRefreshing(false)
        }
    }, [getSupplyInfoScript])

    useEffect(() => {
        if (magic) {
            getSupplyInfo()
        }
    }, [magic, getSupplyInfo])

    const getMintProgress = () => {
        if (!supplyInfo) return 0
        return Math.min((supplyInfo.totalSupply / supplyInfo.maxSupply) * 100, 100)
    }

    return (
        <Card>
            <CardHeader id='Kart-Supply'>Kart NFT Supply Information</CardHeader>
            <CardLabel
                leftHeader='Contract Status'
                rightAction={
                    isRefreshing ? (
                        <div className='loading-container'>
                            <Spinner />
                        </div>
                    ) : (
                        <div onClick={getSupplyInfo}>Refresh</div>
                    )
                }
            />
            <div className='flex-row'>
                <div className='green-dot' />
                <div className='connected'>Connected to Flow Testnet</div>
            </div>
            <Divider />
            <CardLabel
                leftHeader='Contract Address'
            />
            <div className='code'>0xe30b5ab6820d3e32</div>
            <Divider />

            {supplyError && (
                <div className="text-red-600 text-sm p-2 bg-red-50 rounded mb-3">
                    Error: {supplyError}
                </div>
            )}

            {isRefreshing ? (
                <div className="flex justify-center items-center py-4">
                    <Spinner />
                    <span className="ml-2">Loading supply info...</span>
                </div>
            ) : supplyInfo ? (
                <>
                    <CardLabel leftHeader='Total Supply' />
                    <div className='code text-blue-600 font-bold'>
                        {supplyInfo.totalSupply.toLocaleString()} NFTs
                    </div>
                    <Divider />

                    <CardLabel leftHeader='Maximum Supply' />
                    <div className='code text-green-600 font-bold'>
                        {supplyInfo.maxSupply.toLocaleString()} NFTs
                    </div>
                    <Divider />

                    <CardLabel leftHeader='Remaining Supply' />
                    <div className='code text-purple-600 font-bold'>
                        {supplyInfo.remainingSupply.toLocaleString()} NFTs
                    </div>
                    <Divider />

                    <CardLabel leftHeader='Mint Progress' />
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{getMintProgress().toFixed(1)}% Minted</span>
                            <span>{supplyInfo.canMint ? '✅ Can Mint' : '❌ Mint Disabled'}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${getMintProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                    <Divider />

                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="text-xs text-blue-600 font-medium">COMMON</div>
                            <div className="text-xs text-blue-500">Speed 5 (60%)</div>
                            <div className="text-lg">🚲</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="text-xs text-purple-600 font-medium">RARE</div>
                            <div className="text-xs text-purple-500">Speed 8 (30%)</div>
                            <div className="text-lg">🏍️</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                            <div className="text-xs text-yellow-600 font-medium">LEGENDARY</div>
                            <div className="text-xs text-yellow-500">Speed 10 (10%)</div>
                            <div className="text-lg">🏎️</div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-gray-500 text-center py-4">
                    Click refresh to load supply information
                </div>
            )}
        </Card>
    )
}

export default GetKartTotalSupply
