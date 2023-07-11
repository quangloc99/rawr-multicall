import { CHAIN_ID_MAPPING } from '../src/chainId';
import { RPC_URL } from '../helpers/rpc-url';
import { env } from '../helpers/env';

export function describeForChain(
    ...params:
        | [callback: (rpcUrl: string, chain: number) => void]
        | [nameFormatter: (chain: number) => string, callback: (rpcUrl: string, chain: number) => void]
) {
    const [nameFormatter, callback] =
        params.length == 2 ? params : [(chain: number) => `Testing chain ${chain}`, ...params];

    for (const chain of Object.values(CHAIN_ID_MAPPING)) {
        const isAllowedChain = env.ALL_CHAIN || chain === env.CHAIN_ID;
        const name = nameFormatter(chain);
        (isAllowedChain ? describe : describe.skip)(name, () => callback(RPC_URL[chain], chain));
    }
}
