import { Bytes, buildRawMulticallContract, createCall, decodeResult } from '../src';
import { Interface, JsonRpcProvider } from 'ethers';
import { describeForChain, CHAIN_ID_MAPPING, testData } from '@raw-multicall/test-helper';
import { ERC20__factory } from '@raw-multicall/test-helper/ethers-v6-contracts/typechain-types';
import { ERC20Interface } from '@raw-multicall/test-helper/ethers-v6-contracts/typechain-types/ERC20';

const ERC20Iface = new Interface(ERC20__factory.abi) as unknown as ERC20Interface;

describeForChain(
    (chain: number) => `buildRawMulticallContract for chain ${chain}`,
    (rpcUrl: string, chain: number) => {
        const CUR_TEST_DATA = testData.ERC20[chain];

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
                        createCall(tokenAddress, ERC20Iface.encodeFunctionData('name')),
                        createCall(tokenAddress, ERC20Iface.encodeFunctionData('symbol')),
                        createCall(tokenAddress, ERC20Iface.encodeFunctionData('decimals')),
                        createCall(tokenAddress, ERC20Iface.encodeFunctionData('totalSupply')),
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
