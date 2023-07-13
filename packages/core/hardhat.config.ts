import '@typechain/hardhat';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    paths: {
        sources: 'test/contracts',
        artifacts: 'test/artifacts',
    },
    typechain: {
        outDir: 'test/typechain-types',
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
