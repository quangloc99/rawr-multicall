import '@typechain/hardhat';
import { TypechainUserConfig } from '@typechain/hardhat/dist/types';
import { HardhatUserConfig } from 'hardhat/config';

const SUPPORTED_TARGET = ['ethers-v5', 'ethers-v6'];

const target = process.env.TARGET!;
if (!SUPPORTED_TARGET.includes(target)) {
    throw new Error(`Unsupported target ${target}`);
}

const TYPECHAIN_CONFIG: Record<string, TypechainUserConfig> = {
    ['ethers-v5']: {
        outDir: 'typechain-types-ethers-v5',
        target: 'ethers-v5',
    },
    ['ethers-v6']: {
        outDir: 'typechain-types-ethers-v6',
        target: 'ethers-v6',
    },
} as const;

const config: HardhatUserConfig = {
    paths: {
        sources: 'test-contracts',
        artifacts: 'artifacts',
    },
    typechain: TYPECHAIN_CONFIG[target],
    solidity: {
        version: '0.8.17',
    },
};

export default config;
