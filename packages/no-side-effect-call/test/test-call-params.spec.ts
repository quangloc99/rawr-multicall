import { describeForChain, CHAIN_ID_MAPPING } from '@rawr-multicall/test-helper';
import { ethers } from 'ethers';
import { GasAndValueTester__factory } from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types';
import {
    labeledAddress,
    buildRawMulticallContract,
    registerPredeployContract,
    decodeResult,
    unwrap,
} from '@rawr-multicall/core';
import { createEthersV6Call } from '@rawr-multicall/ethers-v6-helper';
import { wrapNoSideEffectCall } from '../src';

describeForChain(
    (chain: number) => `Test gas limit and value for chain ${chain}`,
    (rpcUrl, chain) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const GasANdValueTesterFactory = new GasAndValueTester__factory();
        const contract = GasAndValueTester__factory.connect(ethers.ZeroAddress);
        beforeAll(async () => {
            const { data } = await GasANdValueTesterFactory.getDeployTransaction();
            registerPredeployContract('GasAndValueTester', data);
        });
        const allowPUSH0 = chain != CHAIN_ID_MAPPING.ARBITRUM;

        describe('test value', () => {
            it('simple', async () => {
                const calls = [
                    wrapNoSideEffectCall(
                        await createEthersV6Call(contract, 'testValue', [10], {
                            withAddress: labeledAddress('GasAndValueTester'),
                            value: 10,
                        })
                    ),
                    wrapNoSideEffectCall(
                        await createEthersV6Call(contract, 'testValue', [20], {
                            withAddress: labeledAddress('GasAndValueTester'),
                            value: 10,
                        })
                    ),
                ] as const;
                const calldata = buildRawMulticallContract(calls, { allowPUSH0 });
                expect(calldata.byteCode).toMatchSnapshot();
                expect(calldata.splittedByteCodes).toMatchSnapshot();
                const res = await provider.call({ data: calldata.byteCode.toString(), value: calldata.totalValue });
                expect(res).toMatchSnapshot();
                const result = decodeResult(calls, res);
                expect(result).toMatchSnapshot();
                expect(unwrap(result[0])).toBeTruthy();
                expect(unwrap(result[1])).toBeFalsy();
            });
        });

        describe('testGas', () => {
            // just lose testing
            it('simple', async () => {
                const calls = [
                    // should pass
                    wrapNoSideEffectCall(
                        await createEthersV6Call(contract, 'testGas', [30], {
                            withAddress: labeledAddress('GasAndValueTester'),
                            gasLimit: 100000,
                        })
                    ),
                    // should fail
                    wrapNoSideEffectCall(
                        await createEthersV6Call(contract, 'testGas', [30], {
                            withAddress: labeledAddress('GasAndValueTester'),
                            gasLimit: 100,
                        })
                    ),
                    // should pass again
                    wrapNoSideEffectCall(
                        await createEthersV6Call(contract, 'testGas', [30], {
                            withAddress: labeledAddress('GasAndValueTester'),
                            gasLimit: 100000,
                        })
                    ),
                ];

                const calldata = buildRawMulticallContract(calls, { allowPUSH0 });
                expect(calldata.byteCode).toMatchSnapshot();
                expect(calldata.splittedByteCodes).toMatchSnapshot();
                const res = await provider.call({ data: calldata.byteCode.toString() });
                expect(res).toMatchSnapshot();
                const result = decodeResult(calls, res);
                expect(result).toMatchSnapshot();
                expect(result[0].success).toBeTruthy();
                expect(result[1].success).toBeFalsy();
                expect(result[2].success).toBeTruthy();
            });
        });

        describe('test both gas and value', () => {
            it('simple', async () => {
                const calls = [
                    // should pass
                    wrapNoSideEffectCall(
                        await createEthersV6Call(contract, 'testValueAndGas', [10, 30], {
                            withAddress: labeledAddress('GasAndValueTester'),
                            value: 10,
                            gasLimit: 100000,
                        })
                    ),
                    // should fail because of gas
                    wrapNoSideEffectCall(
                        await createEthersV6Call(contract, 'testValueAndGas', [10, 30], {
                            withAddress: labeledAddress('GasAndValueTester'),
                            value: 10,
                            gasLimit: 100,
                        })
                    ),
                    // should pass but valueOk is false
                    wrapNoSideEffectCall(
                        await createEthersV6Call(contract, 'testValueAndGas', [9, 30], {
                            withAddress: labeledAddress('GasAndValueTester'),
                            value: 10,
                            gasLimit: 100000,
                        })
                    ),
                ];

                const calldata = buildRawMulticallContract(calls, { allowPUSH0 });
                expect(calldata.byteCode).toMatchSnapshot();
                expect(calldata.splittedByteCodes).toMatchSnapshot();
                const res = await provider.call({ data: calldata.byteCode.toString(), value: calldata.totalValue });
                expect(res).toMatchSnapshot();
                const result = decodeResult(calls, res);
                expect(result).toMatchSnapshot();
                expect(result[0].success).toBeTruthy();
                expect(result[1].success).toBeFalsy();
                expect(result[2].success).toBeTruthy();
                expect(unwrap(result[0]).okValue).toBeTruthy();
                expect(unwrap(result[2]).okValue).toBeFalsy();
            });
        });
    }
);
