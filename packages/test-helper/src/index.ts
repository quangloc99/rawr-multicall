import { CHAIN_ID_MAPPING } from './chainId';
import { testEnv } from './test-env';
import { RPC_URL } from './rpc-url';

export { testEnv, RPC_URL, CHAIN_ID_MAPPING };
export * from './jest.config';
export * as testData from './test-data';

export function describeForChain(
    ...params:
        | [callback: (rpcUrl: string, chain: number) => void]
        | [nameFormatter: (chain: number) => string, callback: (rpcUrl: string, chain: number) => void]
) {
    const [nameFormatter, callback] =
        params.length == 2 ? params : [(chain: number) => `Testing chain ${chain}`, ...params];

    for (const chain of Object.values(CHAIN_ID_MAPPING)) {
        const isAllowedChain = testEnv.CHAIN_ID == undefined || chain === testEnv.CHAIN_ID;
        const name = nameFormatter(chain);
        (isAllowedChain ? describe : describe.skip)(name, () => callback(RPC_URL[chain], chain));
    }
}
