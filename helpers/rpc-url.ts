import { CHAIN_ID_MAPPING } from '../src/chainId';

export const RPC_URL: Record<number, string> = {
    [CHAIN_ID_MAPPING.ETHEREUM]: 'https://rpc.ankr.com/eth',
    [CHAIN_ID_MAPPING.ARBITRUM]: 'https://arbitrum-one.publicnode.com',
};
