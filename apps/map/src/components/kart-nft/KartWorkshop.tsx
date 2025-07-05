import { useCallback, useEffect, useState } from 'react';
import { useMagic } from '@/components/magic/MagicAuth';
import showToast from '@/utils/showToast';
import Spinner from '@/components/ui/Spinner';
import * as fcl from '@onflow/fcl';

const KartWorkshop = () => {
    const { magic } = useMagic();
    const [recipient, setRecipient] = useState('');
    const [disabled, setDisabled] = useState(true);
    const [_1, setRecipientError] = useState(false);
    const [_, setHash] = useState('');
    const [transactionLoading, setTransactionLoading] = useState(false);
    const [mintSuccess, setMintSuccess] = useState<string | null>(null);
    const [mintError, setMintError] = useState<string | null>(null);
    const publicAddress = localStorage.getItem('user');

    // Cadence transactions for minting
    const setupCollectionTransaction = `
        import Kart from 0xe30b5ab6820d3e32

        transaction {
            prepare(signer: auth(Storage, Capabilities) &Account) {
                // Check if collection already exists
                if signer.storage.borrow<&Kart.Collection>(from: Kart.CollectionStoragePath) == nil {
                    // Create and save collection
                    let collection <- Kart.createEmptyCollection(nftType: Type<@Kart.NFT>())
                    signer.storage.save(<-collection, to: Kart.CollectionStoragePath)
                    
                    // Create public capability
                    let cap = signer.capabilities.storage.issue<&Kart.Collection>(Kart.CollectionStoragePath)
                    signer.capabilities.publish(cap, at: Kart.CollectionPublicPath)
                }
            }
        }
    `

    const freeMintTransaction = `
        import Kart from 0xe30b5ab6820d3e32

        transaction(recipient: Address) {
            prepare(signer: auth(Storage) &Account) {
                // Call the free mint function
                Kart.freeMint(recipient: recipient)
            }
        }
    `

    useEffect(() => {
        // Auto-fill recipient with current user's address
        if (publicAddress && !recipient) {
            setRecipient(publicAddress)
        }

        // Validate recipient address
        if (recipient) {
            const isValidAddress = recipient.startsWith('0x') && recipient.length === 18
            setRecipientError(!isValidAddress)
            setDisabled(!isValidAddress)
        } else {
            setDisabled(true)
        }
    }, [recipient, publicAddress])

    const setupCollection = async () => {
        if (!magic || !magic.flow) {
            setMintError('Magic Flow extension not available')
            return false
        }

        try {
            // Configure FCL for testnet
            fcl.config({
                'accessNode.api': 'https://rest-testnet.onflow.org',
                'flow.network': 'testnet'
            })

            console.log('Setting up collection...')
            const txId = await fcl.mutate({
                cadence: setupCollectionTransaction,
                proposer: magic.flow.authorization,
                payer: magic.flow.authorization,
                authorizations: [magic.flow.authorization]
            })

            console.log('Setup transaction sent:', txId)

            // Wait for transaction to be sealed
            const transaction = await fcl.tx(txId).onceSealed()
            console.log('Setup transaction sealed:', transaction)

            if (transaction.status === 4) {
                console.log('Collection setup successful')
                return true
            } else {
                throw new Error('Setup transaction failed')
            }
        } catch (err) {
            console.error('Error setting up collection:', err)
            setMintError(err instanceof Error ? err.message : 'Failed to setup collection')
            return false
        }
    }

    const mintKart = useCallback(async () => {
        if (!magic || !magic.flow) {
            setMintError('Magic Flow extension not available')
            return
        }

        if (!recipient) {
            setMintError('Recipient address is required')
            return
        }

        try {
            setTransactionLoading(true)
            setMintError(null)
            setMintSuccess(null)

            // Configure FCL for testnet
            fcl.config({
                'accessNode.api': 'https://rest-testnet.onflow.org',
                'flow.network': 'testnet'
            })

            // First, try to setup collection (in case it doesn't exist)
            console.log('Ensuring collection is set up...')
            const setupSuccess = await setupCollection()
            if (!setupSuccess) {
                return
            }

            console.log('Starting free mint...')
            const txId = await fcl.mutate({
                cadence: freeMintTransaction,
                args: (arg: any, t: any) => [
                    arg(recipient, t.Address)
                ],
                proposer: magic.flow.authorization,
                payer: magic.flow.authorization,
                authorizations: [magic.flow.authorization]
            })

            setHash(txId)
            console.log('Mint transaction sent:', txId)

            // Wait for transaction to be sealed
            const transaction = await fcl.tx(txId).onceSealed()
            console.log('Mint transaction sealed:', transaction)

            if (transaction.status === 4) {
                setMintSuccess(`Successfully minted Kart NFT! Transaction ID: ${txId}`)
                showToast({ message: 'Kart NFT minted successfully!', type: 'success' })
                // Clear form
                setRecipient('')
            } else {
                throw new Error('Mint transaction failed')
            }
        } catch (err) {
            console.error('Error minting NFT:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to mint NFT'
            setMintError(errorMessage)
            showToast({ message: `Mint failed: ${errorMessage}`, type: 'error' })
        } finally {
            setTransactionLoading(false)
        }
    }, [magic, recipient, setupCollectionTransaction, freeMintTransaction])

    return (
        <>
            <h1 className="text-2xl font-bold">Kart Workshop</h1>

            {/* Success Message */}
            {mintSuccess && (
                <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600 text-sm">{mintSuccess}</p>
                </div>
            )}

            {/* Error Message */}
            {mintError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">Error: {mintError}</p>
                </div>
            )}


            <div className="text-xs text-gray-600 mt-2 mb-4">
                <strong>Info:</strong> This will mint a random Kart NFT with speed (5/8/10) and corresponding model.
            </div>

            <div className="flex justify-center mt-4">
                <button
                    onClick={mintKart}
                    disabled={disabled || transactionLoading}
                    className="flex items-center justify-center px-8 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                    {transactionLoading ? (
                        <>
                            <Spinner />
                            <span className="ml-2">Minting...</span>
                        </>
                    ) : (
                        'Free Mint Kart NFT'
                    )}
                </button>
            </div>
        </>
    );
};

export default KartWorkshop;
