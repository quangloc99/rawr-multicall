import '@typechain/hardhat';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    paths: {
        sources: 'test-contracts',
        artifacts: 'artifacts',
    },
    typechain: {
        outDir: 'ethers-v6-contracts/typechain-types',
        target: 'ethers-v6',
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
