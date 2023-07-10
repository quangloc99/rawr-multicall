import { CHAIN_ID_MAPPING } from './chainId';

export const RPC_URL: Record<number, string> = {
    [CHAIN_ID_MAPPING.ETHEREUM]: 'https://rpc.ankr.com/eth',
    [CHAIN_ID_MAPPING.ARBITRUM]: 'https://rpc.ankr.com/arbitrum',
};
