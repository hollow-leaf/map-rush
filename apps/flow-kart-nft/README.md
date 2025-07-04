## 👋 Welcome Flow Developer!

This project is a starting point for you to develop smart contracts on the Flow Blockchain. It comes with example contracts, scripts, transactions, and tests to help you get started.

## 🔨 Getting Started

Here are some essential resources to help you hit the ground running:

- **[Flow Documentation](https://developers.flow.com/)** - The official Flow Documentation is a great starting point to start learning about about [building](https://developers.flow.com/build/flow) on Flow.
- **[Cadence Documentation](https://cadence-lang.org/docs/language)** - Cadence is the native language for the Flow Blockchain. It is a resource-oriented programming language that is designed for developing smart contracts.  The documentation is a great place to start learning about the language.
- **[Visual Studio Code](https://code.visualstudio.com/)** and the **[Cadence Extension](https://marketplace.visualstudio.com/items?itemName=onflow.cadence)** - It is recommended to use the Visual Studio Code IDE with the Cadence extension installed.  This will provide syntax highlighting, code completion, and other features to support Cadence development.
- **[Flow Clients](https://developers.flow.com/tools/clients)** - There are clients available in multiple languages to interact with the Flow Blockchain.  You can use these clients to interact with your smart contracts, run transactions, and query data from the network.
- **[Block Explorers](https://developers.flow.com/ecosystem/block-explorers)** - Block explorers are tools that allow you to explore on-chain data.  You can use them to view transactions, accounts, events, and other information.  [Flowser](https://flowser.dev/) is a powerful block explorer for local development on the Flow Emulator.

## 📦 Project Structure

Your project has been set up with the following structure:

- `flow.json` - This is the configuration file for your project (analogous to a `package.json` file for NPM).  It has been initialized with a basic configuration to get started.
- `/cadence` - This is where your Cadence smart contracts code lives

Inside the `cadence` folder you will find:
- `/contracts` - This folder contains your Cadence contracts (these are deployed to the network and contain the business logic for your application)
  - `Kart.cdc`
- `/scripts` - This folder contains your Cadence scripts (read-only operations)
  - `get_kart_id.cdc`
- `/transactions` - This folder contains your Cadence transactions (state-changing operations)
  - `mint_kart_nft.cdc`
  - `setup_kart_collection.cdc`
  - `transfer_kart_nft.cdc`
- `/tests` - This folder contains your Cadence tests (integration tests for your contracts, scripts, and transactions to verify they behave as expected)
  - `Kart_test.cdc`

## Deploy to Flow testnet
### Create account (testnet)

Create a new Flow testnet account and configure it as `testnet-acct` in your `flow.json`:

```shell
flow accounts create --network=testnet
```

This will create a new account and automatically add it to your `flow.json` deployments configuration.

### Fund your testnet account

Before deploying, you need to fund your testnet account with test FLOW tokens. Visit the Flow testnet faucet:

🚰 **[https://testnet-faucet.onflow.org/fund-account/](https://testnet-faucet.onflow.org/fund-account/)**

Enter your testnet account address to receive test FLOW tokens needed for deployment and transactions.

### Start deploy the contract

Once your account is funded, deploy the contract to testnet:

```shell
flow project deploy --network=testnet
```

## Deploy to emulator network
### Start emulator network

```shell
flow emulator start
```

### Start deploy the contract

```shell
flow project deploy
```
### Create account

```shell
flow accounts create
```

### Sending the `setup_kart_collection` Transaction

To run the `setup_kart_collection` transaction, use the following command:

```shell
flow transactions send cadence/transactions/setup_kart_collection.cdc --signer test-acct --network emulator
```

### Sending the `mint_kart_nft` Transaction

To run the `mint_kart_nft` transaction, use the following command, replace 0x123 with the address for test-acct from flow.json:

```shell
flow transactions send cadence/transactions/mint_kart_nft.cdc 0x123 --signer emulator-account --network emulator
```

### Sending the `transfer_kart_nft` Transaction

To run the `transfer_kart_nft` transaction, use the following command, transfer the NFT from test-acct to test-acct-2, replace 0x124 with the address for test-acct2 from flow.json :

```shell
flow transactions send cadence/transactions/transfer_kart_nft.cdc 0x124 0 --signer test-acct --network emulator
```

### Executing the `get_kart_id` Script

To run the `get_kart_id` script, use the following command, replace 0x123 with the address for test-acct from flow.json:

```shell
flow scripts execute cadence/scripts/get_kart_ids.cdc 0x123
```

To learn more about using the CLI, check out the [Flow CLI Documentation](https://developers.flow.com/tools/flow-cli).

## 👨‍💻 Start Developing

### Creating a New Contract

To add a new contract to your project, run the following command:

```shell
flow generate contract
```

This command will create a new contract file and add it to the `flow.json` configuration file.

### Creating a New Script

To add a new script to your project, run the following command:

```shell
flow generate script
```

This command will create a new script file.  Scripts are used to read data from the blockchain and do not modify state (i.e. get the current balance of an account, get a user's NFTs, etc).

You can import any of your own contracts or installed dependencies in your script file using the `import` keyword.  For example:

```cadence
import "Kart"
```

### Creating a New Transaction

To add a new transaction to your project you can use the following command:

```shell
flow generate transaction
```

This command will create a new transaction file.  Transactions are used to modify the state of the blockchain (i.e purchase an NFT, transfer tokens, etc).

You can import any dependencies as you would in a script file.

### Creating a New Test

To add a new test to your project you can use the following command:

```shell
flow generate test
```

This command will create a new test file.  Tests are used to verify that your contracts, scripts, and transactions are working as expected.

### Installing External Dependencies

If you want to use external contract dependencies (such as NonFungibleToken, FlowToken, FungibleToken, etc.) you can install them using [Flow CLI Dependency Manager](https://developers.flow.com/tools/flow-cli/dependency-manager).

For example, to install the NonFungibleToken contract you can use the following command:

```shell
flow deps add mainnet://1d7e57aa55817448.NonFungibleToken
```

Contracts can be found using [ContractBrowser](https://contractbrowser.com/), but be sure to verify the authenticity before using third-party contracts in your project.

## 🧪 Testing

To verify that your project is working as expected you can run the tests using the following command:

```shell
flow test
```

This command will run all tests with the `_test.cdc` suffix (these can be found in the `cadence/tests` folder). You can add more tests here using the `flow generate test` command (or by creating them manually).

To learn more about testing in Cadence, check out the [Cadence Test Framework Documentation](https://cadence-lang.org/docs/testing-framework).

## 🚀 Deploying Your Project

To deploy your project to the Flow network, you must first have a Flow account and have configured your deployment targets in the `flow.json` configuration file.

You can create a new Flow account using the following command:

```shell
flow accounts create
```

Learn more about setting up deployment targets in the [Flow CLI documentation](https://developers.flow.com/tools/flow-cli/deployment/project-contracts).

### Deploying to the Flow Emulator

To deploy your project to the Flow Emulator, start the emulator using the following command:

```shell
flow emulator --start
```

To deploy your project, run the following command:

```shell
flow project deploy --network=emulator
```

This command will start the Flow Emulator and deploy your project to it. You can now interact with your project using the Flow CLI or alternate [client](https://developers.flow.com/tools/clients).

### Deploying to Flow Testnet

To deploy your project to Flow Testnet you can use the following command:

```shell
flow project deploy --network=testnet
```

This command will deploy your project to Flow Testnet. You can now interact with your project on this network using the Flow CLI or any other Flow client.

### Deploying to Flow Mainnet

To deploy your project to Flow Mainnet you can use the following command:

```shell
flow project deploy --network=mainnet
```

This command will deploy your project to Flow Mainnet. You can now interact with your project using the Flow CLI or alternate [client](https://developers.flow.com/tools/clients).

## 📚 Other Resources

- [Cadence Design Patterns](https://cadence-lang.org/docs/design-patterns)
- [Cadence Anti-Patterns](https://cadence-lang.org/docs/anti-patterns)
- [Flow Core Contracts](https://developers.flow.com/build/core-contracts)

## 🤝 Community
- [Flow Community Forum](https://forum.flow.com/)
- [Flow Discord](https://discord.gg/flow)
- [Flow Twitter](https://x.com/flow_blockchain)
