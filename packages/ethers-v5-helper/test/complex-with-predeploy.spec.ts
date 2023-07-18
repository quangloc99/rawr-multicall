import { describeForChain, CHAIN_ID_MAPPING, hexStringContains } from '@rawr-multicall/test-helper';
import { ethers } from 'ethers';
import { APlusB__factory, TestContract__factory, ThrowError__factory } from '../ethers-v5-contracts/typechain-types';
import {
    labeledAddress,
    buildRawrMulticallContract,
    resetPredeployContracts,
    registerPredeployContract,
    decodeResult,
    assertDefined,
} from '@rawr-multicall/core';
import { createEthersV5Call } from '../src';

describeForChain(
    (chain: number) => `Test predeploy contracts for chain ${chain}`,
    (rpcUrl, chain) => {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const APlusBFactory = new APlusB__factory();
        const TestContractFactory = new TestContract__factory();
        const ThrowErrorFactory = new ThrowError__factory();
        const aPlusBContract = APlusB__factory.connect(ethers.constants.AddressZero, provider);
        const testContract = TestContract__factory.connect(ethers.constants.AddressZero, provider);
        const throwErrorContract = ThrowError__factory.connect(ethers.constants.AddressZero, provider);
        const allowPUSH0 = chain !== CHAIN_ID_MAPPING.ARBITRUM;

        beforeEach(() => {
            resetPredeployContracts();
        });

        it('simple', async () => {
            const calls = [
                createEthersV5Call(aPlusBContract, 'plus', [10, 20], { withAddress: labeledAddress('test') }),
                createEthersV5Call(aPlusBContract, 'minus', [10, 20], { withAddress: labeledAddress('test') }),
            ] as const;
            const testContractByteCode = ethers.utils.hexlify(assertDefined(APlusBFactory.getDeployTransaction().data));
            const callData = buildRawrMulticallContract(calls, {
                allowPUSH0,
                predeployContracts: { test: testContractByteCode },
            });
            expect(callData).toMatchSnapshot();
            const res = await provider.call({ data: callData.byteCode.toString() });
            expect(res).toMatchSnapshot();
            expect(hexStringContains(callData.byteCode, testContractByteCode)).toBeTruthy();
            const result = decodeResult(calls, res);
            expect(result).toMatchSnapshot();
        });

        it('complex', async () => {
            const aPlusBContractByteCode = ethers.utils.hexlify(
                assertDefined(APlusBFactory.getDeployTransaction().data)
            );
            const testContractByteCode = ethers.utils.hexlify(
                assertDefined(TestContractFactory.getDeployTransaction().data)
            );

            const calls = [
                createEthersV5Call(aPlusBContract, 'plus', [1, 2], { withAddress: labeledAddress('a') }),
                createEthersV5Call(aPlusBContract, 'plus', [3, 4], { withAddress: labeledAddress('b') }),
                createEthersV5Call(aPlusBContract, 'minus', [5, 6], { withAddress: labeledAddress('c') }),

                createEthersV5Call(testContract, 'compare', [1, 2], { withAddress: labeledAddress('x') }),
                createEthersV5Call(testContract, 'swapXY', [{ x: 1, y: 2 }], {
                    withAddress: labeledAddress('y'),
                }),
                createEthersV5Call(testContract, 'hash', [1], { withAddress: labeledAddress('z') }),
            ];

            const callData = buildRawrMulticallContract(calls, {
                allowPUSH0,
                predeployContracts: {
                    a: aPlusBContractByteCode,
                    b: aPlusBContractByteCode,
                    c: aPlusBContractByteCode,
                    x: testContractByteCode,
                    y: testContractByteCode,
                    z: testContractByteCode,
                },
            });

            expect(callData).toMatchSnapshot();
            const res = await provider.call({ data: callData.byteCode.toString() });
            const decodedResult = decodeResult(calls, res);
            expect(res).toMatchSnapshot();
            expect(decodedResult).toMatchSnapshot();
        });

        it('throw error', async () => {
            const throwErrorContractByteCode = ethers.utils.hexlify(
                assertDefined(ThrowErrorFactory.getDeployTransaction().data)
            );
            registerPredeployContract('throw-error', throwErrorContractByteCode);
            const calls = [
                createEthersV5Call(throwErrorContract, 'justRevert', ['abc'], {
                    withAddress: labeledAddress('throw-error'),
                }),
                createEthersV5Call(throwErrorContract, 'revertError', ['xyz'], {
                    withAddress: labeledAddress('throw-error'),
                }),
                createEthersV5Call(throwErrorContract, 'revertCustom', [1], {
                    withAddress: labeledAddress('throw-error'),
                }),
                createEthersV5Call(throwErrorContract, 'revertPanic', [], {
                    withAddress: labeledAddress('throw-error'),
                }),
            ] as const;

            const calldata = buildRawrMulticallContract(calls, { allowPUSH0 });
            expect(calldata).toMatchSnapshot();
            const res = await provider.call({ data: calldata.byteCode.toString() });
            const decodedRes = decodeResult(calls, res);
            expect(decodedRes).toMatchSnapshot();
        });
    }
);
