import { createEthersV6Call } from '../src';
import { buildRawMulticallContract, decodeResult, Bytes } from '@rawr-multicall/core';
import { CHAIN_ID_MAPPING, describeForChain, testData } from '@rawr-multicall/test-helper';
import { BaseContract, JsonRpcProvider } from 'ethers';
import { ERC20, ERC20__factory } from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types';

describeForChain(
    (chain: number) => `buildRawMulticallContract for chain ${chain}`,
    (rpcUrl: string, chain: number) => {
        const CUR_TEST_DATA = testData.ERC20[chain];

        let provider: JsonRpcProvider;
        const blockTag = CUR_TEST_DATA.blockNumber;

        const doSend = (data: Bytes | string) => provider.call({ data: data.toString(), blockTag });
        const allowPUSH0 = chain != CHAIN_ID_MAPPING.ARBITRUM;

        beforeAll(() => {
            provider = new JsonRpcProvider(rpcUrl);
        });

        describe('erc20', () => {
            it('simple', async () => {
                const contract = new BaseContract(CUR_TEST_DATA.tokenAddresses[0], ERC20__factory.abi) as ERC20;
                const calls = [await createEthersV6Call(contract, 'name', [])];
                const sendData = buildRawMulticallContract(calls, { allowPUSH0 });
                expect(sendData).toMatchSnapshot();
                const res = await doSend(sendData.byteCode);
                expect(res).toMatchSnapshot();
                const output = decodeResult(calls, res);
                expect(output).toMatchSnapshot();
            });

            it('complex', async () => {
                const calls = await Promise.all(
                    CUR_TEST_DATA.tokenAddresses.map((tokenAddress) => {
                        const contract = new BaseContract(tokenAddress, ERC20__factory.abi) as ERC20;

                        return Promise.all([
                            createEthersV6Call(contract, 'name', []),
                            createEthersV6Call(contract, 'symbol', []),
                            createEthersV6Call(contract, 'decimals', []),
                            createEthersV6Call(contract, 'totalSupply', []),
                            ...CUR_TEST_DATA.holders.map((holder) =>
                                createEthersV6Call(contract, 'balanceOf', [holder])
                            ),
                        ] as const);
                    })
                ).then((res) => res.flat());

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
