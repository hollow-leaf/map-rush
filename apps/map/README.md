
# MapRush: Flow Blockchain NFT Marketplace & GameFi Platform

MapRush is a decentralized application (dApp) built on the Flow blockchain, focused on enabling users to buy and sell filcdn NFTs. These NFTs are designed for high-speed integration as model assets in GameFi applications, making them ideal for gaming, metaverse, and digital collectibles use cases.

## Features

- **Flow Blockchain Integration**: Secure, scalable, and user-friendly NFT transactions powered by Flow.
- **filcdn NFT Marketplace**: Buy and sell filcdn NFTs directly within the app.
- **GameFi Model Carrier**: NFTs are optimized for rapid deployment as in-game models, supporting seamless GameFi experiences.
- **Modern Web UI**: Built with React and Vite for a fast, responsive, and intuitive user interface.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- bun

### Installation
1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd maprush
   ```
2. Install dependencies:
   ```sh
   bun install
   ```

### Development
To start the development server for the main app:
```sh
cd apps/map
bun dev
```

### Build
To build the app for production:
```sh
cd apps/map
bun run build
```

## Project Structure
- `apps/map/` - Main Flow blockchain dApp for NFT trading and GameFi integration
- `apps/flow-kart-nft/` - Example Flow NFT contract and scripts
- `packages/game-assets/` - Shared game asset configurations and utilities

## NFT & GameFi Integration
- **filcdn NFTs**: Designed for high-speed, on-chain model delivery and in-game use.
- **GameFi Ready**: Instantly use purchased NFTs as game models in supported GameFi platforms.

## License
MIT
