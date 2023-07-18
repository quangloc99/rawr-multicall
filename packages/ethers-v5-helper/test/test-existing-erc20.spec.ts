import { createEthersV5Call } from '../src';
import { buildRawrMulticallContract, decodeResult, Bytes } from '@rawr-multicall/core';
import { CHAIN_ID_MAPPING, describeForChain, testData } from '@rawr-multicall/test-helper';
import { providers } from 'ethers';
import { ERC20__factory } from '../ethers-v5-contracts/typechain-types';

describeForChain(
    (chain: number) => `buildRawrMulticallContract for chain ${chain}`,
    (rpcUrl: string, chain: number) => {
        const CUR_TEST_DATA = testData.ERC20[chain];

        let provider: providers.JsonRpcProvider;
        const blockTag = CUR_TEST_DATA.blockNumber;

        const doSend = (data: Bytes | string) => provider.call({ data: data.toString() }, blockTag);
        const allowPUSH0 = chain != CHAIN_ID_MAPPING.ARBITRUM;

        beforeAll(() => {
            provider = new providers.JsonRpcProvider(rpcUrl);
        });

        describe('erc20', () => {
            it('simple', async () => {
                const contract = ERC20__factory.connect(CUR_TEST_DATA.tokenAddresses[0], provider);
                const calls = [createEthersV5Call(contract, 'name', [])];
                const sendData = buildRawrMulticallContract(calls, { allowPUSH0 });
                expect(sendData).toMatchSnapshot();
                const res = await doSend(sendData.byteCode);
                expect(res).toMatchSnapshot();
                const output = decodeResult(calls, res);
                expect(output).toMatchSnapshot();
            });

            it('complex', async () => {
                const calls = await Promise.all(
                    CUR_TEST_DATA.tokenAddresses.map((tokenAddress) => {
                        const contract = ERC20__factory.connect(tokenAddress, provider);

                        return Promise.all([
                            createEthersV5Call(contract, 'name', []),
                            createEthersV5Call(contract, 'symbol', []),
                            createEthersV5Call(contract, 'decimals', []),
                            createEthersV5Call(contract, 'totalSupply', []),
                            ...CUR_TEST_DATA.holders.map((holder) =>
                                createEthersV5Call(contract, 'balanceOf', [holder])
                            ),
                        ] as const);
                    })
                ).then((res) => res.flat());

                const sendData = buildRawrMulticallContract(calls, { allowPUSH0 });
                expect(sendData).toMatchSnapshot();
                const res = await doSend(sendData.byteCode);
                expect(res).toMatchSnapshot();
                const output = decodeResult(calls, res);
                expect(output).toMatchSnapshot();
            });
        });
    }
);
