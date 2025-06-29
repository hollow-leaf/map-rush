# Kart Magic Link - Vite Version

This is a Vite version of the Kart Magic Link project, converted from Next.js to Vite for better performance and modern development experience.

This scaffold is meant to help you bootstrap your own projects with Magic's [Dedicated Wallet](https://magic.link/docs/auth/overview). Magic is a developer SDK that integrates with your application to enable passwordless Web3 onboarding.

The folder structure of this scaffold is designed to encapsulate all things Magic into one place so you can easily add or remove components and functionality. For example, all Magic-specific components are in the `src/components/magic` directory while generic UI components are in the `src/components/ui` directory.

## Features

- React 19 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Magic Link authentication with Flow blockchain
- Flow NFT integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your Magic API key and blockchain network:
```
VITE_MAGIC_API_KEY=your_magic_api_key_here
VITE_BLOCKCHAIN_NETWORK=flow-testnet
```

## Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Build

Build for production:
```bash
npm run build
```

## Environment Variables

- `VITE_MAGIC_API_KEY`: Your Magic Link API key
- `VITE_BLOCKCHAIN_NETWORK`: Flow blockchain network (flow-testnet or flow-mainnet)

## Key Differences from Next.js Version

- Uses Vite instead of Next.js for faster development
- Environment variables use `VITE_` prefix instead of `NEXT_PUBLIC_`
- Uses `import.meta.env` instead of `process.env`
- Entry point is `src/main.tsx` instead of pages structure
- Modern React 19 with improved performance
