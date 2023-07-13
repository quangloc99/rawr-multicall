import { Bytes, buildRawMulticallContract, createCall, decodeResult } from '../src';
import { Interface, JsonRpcProvider } from 'ethers';
import { ERC20Abi } from './abi';
import { describeForChain, CHAIN_ID_MAPPING } from '@raw-multicall/test-helper';

const TEST_DATA: Record<
    number,
    {
        blockNumber: number;
        tokenAddresses: string[];
        holders: string[];
    }
> = {
    [CHAIN_ID_MAPPING.ETHEREUM]: {
        blockNumber: 17670778,
        tokenAddresses: [
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // usdc
            '0x808507121b80c02388fad14726482e061b8da827', // pendle
        ],
        holders: ['0xa3a7b6f88361f48403514059f1f16c8e78d60eec', '0x28c6c06298d514db089934071355e5743bf21d60'],
    },
    [CHAIN_ID_MAPPING.ARBITRUM]: {
        blockNumber: 110135034,
        tokenAddresses: [
            '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // usdt,
            '0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8', // pendle
        ],
        holders: ['0xb38e8c17e38363af6ebdcb3dae12e0243582891d', '0xf89d7b9c864f589bbf53a82105107622b35eaa40'],
    },
};
const ERC20Iface = new Interface(ERC20Abi);

describeForChain(
    (chain: number) => `buildRawMulticallContract for chain ${chain}`,
    (rpcUrl: string, chain: number) => {
        const CUR_TEST_DATA = TEST_DATA[chain];

        let provider: JsonRpcProvider;
        const blockTag = CUR_TEST_DATA.blockNumber;

        const doSend = (data: Bytes) => provider.call({ data, blockTag });
        const allowPUSH0 = chain != CHAIN_ID_MAPPING.ARBITRUM;

        beforeAll(() => {
            provider = new JsonRpcProvider(rpcUrl);
        });

        describe('erc20', () => {
            it('simple', async () => {
                const callData = ERC20Iface.encodeFunctionData('balanceOf', [CUR_TEST_DATA.holders[0]]);
                const calls = [createCall(CUR_TEST_DATA.tokenAddresses[1], callData)] as const;
                const sendData = buildRawMulticallContract(calls, { allowPUSH0 });
                expect(callData).toMatchSnapshot();
                expect(sendData).toMatchSnapshot();
                const res = await doSend(sendData.byteCode);
                expect(res).toMatchSnapshot();
                const output = decodeResult(calls, res);
                expect(output).toMatchSnapshot();
            });

            it('complex', async () => {
                const calls = CUR_TEST_DATA.tokenAddresses
                    .map((tokenAddress) => [
                        createCall(tokenAddress, ERC20Iface.encodeFunctionData('name', [])),
                        createCall(tokenAddress, ERC20Iface.encodeFunctionData('symbol', [])),
                        createCall(tokenAddress, ERC20Iface.encodeFunctionData('decimals', [])),
                        createCall(tokenAddress, ERC20Iface.encodeFunctionData('totalSupply', [])),
                        ...CUR_TEST_DATA.holders.map((holder) =>
                            createCall(tokenAddress, ERC20Iface.encodeFunctionData('balanceOf', [holder]))
                        ),
                    ])
                    .flat();

                const sendData = buildRawMulticallContract(calls, { allowPUSH0 });
                expect(sendData).toMatchSnapshot();
                const res = await doSend(sendData.byteCode);
                expect(res).toMatchSnapshot();
                const output = decodeResult(calls, res);
                expect(output).toMatchSnapshot();
            });
        });
    }
);
