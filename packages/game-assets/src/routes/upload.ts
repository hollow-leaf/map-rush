import { t } from 'elysia'
import { Synapse, TOKENS, CONTRACT_ADDRESSES } from '@filoz/synapse-sdk'
import { ethers } from 'ethers'

// Configuration from environment - User will need to set these
const PRIVATE_KEY = process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1'

export const requestBody = t.Object({
  // Assuming 'file' will be a single file for now.
  // Elysia's t.File() might be more appropriate if it's a direct file upload
  // and not multipart/form-data. For multipart, t.Files() is okay.
  file: t.Files({
    // Potentially add validation for file types, size, etc.
    // type: ['image/png', 'application/octet-stream'], // Example
    // maxSize: '5m' // Example
  }), 
},{
  description: 'File to upload',
  // 'required' is not a standard t.Object property, validation happens at schema level
})

// Helper function to convert File/Blob to Buffer
async function fileToBuffer(file: File | Blob): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper to format USDFC amounts (18 decimals)
function formatUSDFC (amount: bigint) {
  const usdfc = Number(amount) / 1e18
  return usdfc.toFixed(6) + ' USDFC'
}

export const upload = async (body: {file: File[] | File}) => {
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is not set.");
  }

  // Ensure 'file' exists and is correctly accessed.
  // If t.Files() is used, body.file will be an array of File objects.
  // If t.File() is used (for a single file upload), body.file would be a single File object.
  // We'll assume it could be an array from t.Files() and take the first one.
  const fileToUpload = Array.isArray(body.file) ? body.file[0] : body.file;

  if (!fileToUpload) {
    // Consider returning a more specific HTTP error code if used in an Elysia handler
    throw new Error("File is required for upload");
  }

  try {
    // Initialise the SDK
    const synapse = await Synapse.create({
      withCDN: true,
      privateKey: PRIVATE_KEY,
      rpcURL: RPC_URL
    })

    const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[synapse.getNetwork()]
    let serviceStatus = await synapse.payments.serviceApproval(pandoraAddress)

    if (!serviceStatus.isApproved) {
      console.log('\n--- Checking Balances ---')
      const filBalance = await synapse.payments.walletBalance()
      const usdfcBalance = await synapse.payments.walletBalance('USDFC')
      console.log(`FIL balance: ${Number(filBalance) / 1e18} FIL`)
      console.log(`USDFC balance: ${formatUSDFC(usdfcBalance)}`)

      // 1. Deposit USDFC tokens (one-time setup)
      const amount = ethers.parseUnits('10', 18)  // 10 USDFC
      await synapse.payments.deposit(amount, TOKENS.USDFC)
      console.log(`✓ Deposited ${formatUSDFC(amount)}`)

      // 2. Approve the Pandora service for automated payments
      await synapse.payments.approveService(
        pandoraAddress,
        ethers.parseUnits('10', 18),   // Rate allowance: 10 USDFC per epoch
        ethers.parseUnits('1000', 18)  // Lockup allowance: 1000 USDFC total
      )
      console.log(`✓ Approved Pandora service for payments`)

      // Poll until the service is approved
      serviceStatus = await synapse.payments.serviceApproval(pandoraAddress)
      while (!serviceStatus.isApproved) {
        console.log('Waiting for service approval...')
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        serviceStatus = await synapse.payments.serviceApproval(pandoraAddress)
      }
      console.log('✓ Service is approved')
    }

    // Create storage service
    const storageService = await synapse.createStorage({
      callbacks: {
        onProviderSelected: (provider) => {
          console.log(`✓ Selected storage provider: ${provider.owner}`)
          console.log(`  PDP URL: ${provider.pdpUrl}`)
        },
        onProofSetResolved: (info) => {
          if (info.isExisting) {
            console.log(`✓ Using existing proof set: ${info.proofSetId}`)
          } else {
            console.log(`✓ Created new proof set: ${info.proofSetId}`)
          }
        },
        onProofSetCreationStarted: (transaction, statusUrl) => {
          console.log(`  Creating proof set, tx: ${transaction.hash}`)
        },
        onProofSetCreationProgress: (progress) => {
          if (progress.transactionMined && !progress.proofSetLive) {
            console.log('  Transaction mined, waiting for proof set to be live...')
          }
        },
      },
    })

    // Read the file into an in-memory buffer
    const fileData = await fileToBuffer(fileToUpload);

    // Run preflight checks
    const preflight = await storageService.preflightUpload(fileData.length)

    if (!preflight.allowanceCheck.sufficient) {
      // The Filecoin Services deal is not sufficient
      // You need to increase the allowance, e.g. via the web app
      // Consider logging this or returning a specific error message/code
      console.error('Allowance not sufficient. Please increase allowance via the web app.');
      throw new Error('Allowance not sufficient.');
    }

    const uploadResult = await storageService.upload(fileData)
    const cid = uploadResult.commp
    
    console.log(`✓ File uploaded successfully. CID: ${cid}`)
    return { cid }; // Return the CID

  } catch (error) {
    console.error("Error during Synapse SDK operation or file upload:", error);
    // Re-throw or handle as appropriate for your application's error handling strategy
    // For an API, you might want to return a structured error response
    if (error instanceof Error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during upload.");
  }
};
