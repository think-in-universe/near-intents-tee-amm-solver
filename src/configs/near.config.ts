import { keyStores } from 'near-api-js';
import { NearChainId, INearAccountConfig, INearConnectionConfig } from '../interfaces/near.interface';

export const nearNetworkId = (process.env.NEAR_NETWORK_ID as NearChainId) || NearChainId.MAINNET;

export const nearDefaultConnectionConfigs = {
  [NearChainId.MAINNET]: {
    networkId: NearChainId.MAINNET,
    nodeUrls: ['https://near.lava.build', 'https://free.rpc.fastnear.com'],
    walletUrl: 'https://wallet.mainnet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
    keyStore: new keyStores.InMemoryKeyStore(),
  },
  [NearChainId.TESTNET]: {
    networkId: NearChainId.TESTNET,
    nodeUrls: ['https://neart.lava.build', 'https://test.rpc.fastnear.com'],
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    keyStore: new keyStores.InMemoryKeyStore(),
  },
};

export const nearConnectionConfigs: INearConnectionConfig[] = nearDefaultConnectionConfigs[nearNetworkId].nodeUrls.map((nodeUrl) => ({
  ...nearDefaultConnectionConfigs[nearNetworkId],
  nodeUrl: nodeUrl,
}));

export const nearAccountConfig: INearAccountConfig = {
  accountId: process.env.NEAR_ACCOUNT_ID!,
  privateKey: process.env.NEAR_PRIVATE_KEY!,
};
