import { describeForChain, CHAIN_ID_MAPPING } from '@rawr-multicall/test-helper';
import { ethers } from 'ethers';
import { GasAndValueTester__factory } from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types';
import {
    labeledAddress,
    buildRawMulticallContract,
    createCall,
    registerPredeployContract,
    decodeResult,
    unwrap,
} from '../src';

describeForChain(
    (chain: number) => `Test gas limit and value for chain ${chain}`,
    (rpcUrl, chain) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const GasANdValueTesterFactory = new GasAndValueTester__factory();
        const iface = GasAndValueTester__factory.connect(ethers.ZeroAddress).interface;
        beforeAll(async () => {
            const { data } = await GasANdValueTesterFactory.getDeployTransaction();
            registerPredeployContract('GasAndValueTester', data);
        });
        const allowPUSH0 = chain != CHAIN_ID_MAPPING.ARBITRUM;

        describe('test value', () => {
            it('simple', async () => {
                const calls = [
                    createCall(labeledAddress('GasAndValueTester'), iface.encodeFunctionData('testValue', [10]), {
                        value: 10,
                    }),
                    createCall(labeledAddress('GasAndValueTester'), iface.encodeFunctionData('testValue', [20]), {
                        value: 10,
                    }),
                ];
                const calldata = buildRawMulticallContract(calls, { allowPUSH0 });
                expect(calldata.byteCode).toMatchSnapshot();
                expect(calldata.splittedByteCodes).toMatchSnapshot();
                const res = await provider.call({ data: calldata.byteCode.toString(), value: calldata.totalValue });
                expect(res).toMatchSnapshot();
                const result = decodeResult(calls, res);
                expect(result).toMatchSnapshot();
                expect(iface.decodeFunctionResult('testValue', unwrap(result[0]))[0]).toBeTruthy();
                expect(iface.decodeFunctionResult('testValue', unwrap(result[1]))[0]).toBeFalsy();
            });

            it('not enough value', async () => {
                const calls = [
                    createCall(labeledAddress('GasAndValueTester'), iface.encodeFunctionData('testValue', [10]), {
                        value: 10,
                    }),
                    createCall(labeledAddress('GasAndValueTester'), iface.encodeFunctionData('testValue', [20]), {
                        value: 10,
                    }),
                    createCall(labeledAddress('GasAndValueTester'), iface.encodeFunctionData('testValue', [30]), {
                        value: 10,
                    }),
                ];
                const calldata = buildRawMulticallContract(calls, { allowPUSH0 });
                expect(calldata.byteCode).toMatchSnapshot();
                expect(calldata.splittedByteCodes).toMatchSnapshot();
                const res = await provider.call({
                    data: calldata.byteCode.toString(),
                    value: calldata.totalValue - 11,
                });
                expect(res).toMatchSnapshot();
                const result = decodeResult(calls, res);
                expect(result).toMatchSnapshot();
                expect(iface.decodeFunctionResult('testValue', unwrap(result[0]))[0]).toBeTruthy();
                expect(result[1].success).toBeFalsy();
                expect(result[2].success).toBeFalsy();
            });
        });

        describe('testGas', () => {
            // just lose testing
            it('simple', async () => {
                const calls = [
                    // should pass
                    createCall(labeledAddress('GasAndValueTester'), iface.encodeFunctionData('testGas', [30]), {
                        gasLimit: 100000,
                    }),
                    // should fail
                    createCall(labeledAddress('GasAndValueTester'), iface.encodeFunctionData('testGas', [30]), {
                        gasLimit: 100,
                    }),
                    // should pass again
                    createCall(labeledAddress('GasAndValueTester'), iface.encodeFunctionData('testGas', [30]), {
                        gasLimit: 100000,
                    }),
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
                    createCall(
                        labeledAddress('GasAndValueTester'),
                        iface.encodeFunctionData('testValueAndGas', [10, 30]),
                        {
                            value: 10,
                            gasLimit: 100000,
                        }
                    ),
                    // should fail because of gas
                    createCall(
                        labeledAddress('GasAndValueTester'),
                        iface.encodeFunctionData('testValueAndGas', [10, 30]),
                        {
                            value: 10,
                            gasLimit: 100,
                        }
                    ),
                    // should pass but valueOk is false
                    createCall(
                        labeledAddress('GasAndValueTester'),
                        iface.encodeFunctionData('testValueAndGas', [9, 30]),
                        {
                            value: 10,
                            gasLimit: 100000,
                        }
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
                expect(iface.decodeFunctionResult('testValueAndGas', unwrap(result[0]))[0]).toBeTruthy();
                expect(iface.decodeFunctionResult('testValueAndGas', unwrap(result[2]))[0]).toBeFalsy();
            });
        });
    }
);
