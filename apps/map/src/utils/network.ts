export const Network = {
  FLOW_MAINNET: 'flow-mainnet',
  FLOW_TESTNET: 'flow-testnet',
} as const;
type Network = typeof Network[keyof typeof Network];

export const getNetworkUrl = () => {
  switch (import.meta.env.VITE_BLOCKCHAIN_NETWORK) {
    case Network.FLOW_MAINNET:
      return 'https://rest-mainnet.onflow.org';
    case Network.FLOW_TESTNET:
      return 'https://rest-testnet.onflow.org';
    default:
      throw new Error('Network not supported');
  }
};

export const getNetwork = () => {
  switch (import.meta.env.VITE_BLOCKCHAIN_NETWORK) {
    case Network.FLOW_MAINNET:
      return 'mainnet';
    case Network.FLOW_TESTNET:
      return 'testnet';
  }
};

export const getFaucetUrl = () => {
  switch (import.meta.env.VITE_BLOCKCHAIN_NETWORK) {
    case Network.FLOW_TESTNET:
      return 'https://testnet-faucet.onflow.org/fund-account/';
  }
};

export const getNetworkName = () => {
  switch (import.meta.env.VITE_BLOCKCHAIN_NETWORK) {
    case Network.FLOW_MAINNET:
      return 'Flow (Mainnet)';
    case Network.FLOW_TESTNET:
      return 'Flow (Testnet)';
  }
};

export const getBlockExplorer = (address: string) => {
  switch (import.meta.env.VITE_BLOCKCHAIN_NETWORK) {
    case Network.FLOW_MAINNET:
      return `https://flowscan.org/account/${address}`;
    case Network.FLOW_TESTNET:
      return `https://testnet.flowscan.org/account/${address}`;
  }
};
