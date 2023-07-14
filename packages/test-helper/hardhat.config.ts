import '@typechain/hardhat';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    paths: {
        sources: 'test-contracts',
        artifacts: 'artifacts',
    },
    typechain: {
        outDir: 'typechain-types-ethers-v6',
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
