import { HardhatUserConfig } from 'hardhat/config';
import { env } from './helpers/env';

const CHAIN_ID_MAPPING = {
    ETHEREUM: 0x1,
    ARBITRUM: 42161,
} as const;

export const RPC_URL: Record<number, string> = {
    [CHAIN_ID_MAPPING.ETHEREUM]: 'https://rpc.ankr.com/eth',
    [CHAIN_ID_MAPPING.ARBITRUM]: 'https://rpc.ankr.com/arbitrum',
};

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            forking: {
                url: RPC_URL[env.CHAIN_ID],
                blockNumber: env.BLOCK_NUMBER,
            },
        },
    },
};

export default config;
