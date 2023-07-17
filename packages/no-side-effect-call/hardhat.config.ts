import '@typechain/hardhat';
import '@tovarishfin/hardhat-yul';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    paths: {
        sources: 'contracts',
        artifacts: 'artifacts',
    },
    solidity: {
        version: '0.8.17',
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
};

export default config;
