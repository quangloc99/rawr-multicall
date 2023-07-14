import { describeForChain, CHAIN_ID_MAPPING } from '@raw-multicall/test-helper';
import { ethers, BaseContract } from 'ethers';
import {
    APlusB__factory,
    TestContract__factory,
    ThrowError__factory,
} from '@raw-multicall/test-helper/typechain-types-ethers-v6';
import { APlusB } from '@raw-multicall/test-helper/typechain-types-ethers-v6/APlusB';
import { TestContract } from '@raw-multicall/test-helper/typechain-types-ethers-v6/TestContract';
import { ThrowError } from '@raw-multicall/test-helper/typechain-types-ethers-v6/ThrowError';
import {
    labeledAddress,
    buildRawMulticallContract,
    resetPredeployContracts,
    registerPredeployContract,
    strip0x,
    decodeResult,
} from '@raw-multicall/core';
import { createEthersV6Call } from '../src';

describeForChain(
    (chain: number) => `Test predeploy contracts for chain ${chain}`,
    (rpcUrl, chain) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const APlusBFactory = new APlusB__factory();
        const TestContractFactory = new TestContract__factory();
        const ThrowErrorFactory = new ThrowError__factory();
        const aPlusBContract = new BaseContract(ethers.ZeroAddress, APlusB__factory.abi) as APlusB;
        const testContract = new BaseContract(ethers.ZeroAddress, TestContract__factory.abi) as TestContract;
        const throwErrorContract = new BaseContract(ethers.ZeroAddress, ThrowError__factory.abi) as ThrowError;
        const allowPUSH0 = chain !== CHAIN_ID_MAPPING.ARBITRUM;

        beforeEach(() => {
            resetPredeployContracts();
        });

        it('simple', async () => {
            const calls = [
                await createEthersV6Call(aPlusBContract, 'plus', [10, 20], { withAddress: labeledAddress('test') }),
                await createEthersV6Call(aPlusBContract, 'minus', [10, 20], { withAddress: labeledAddress('test') }),
            ] as const;
            const testContractByteCode = (await APlusBFactory.getDeployTransaction()).data;
            const callData = buildRawMulticallContract(calls, {
                allowPUSH0,
                predeployContracts: { test: testContractByteCode },
            });
            expect(callData).toMatchSnapshot();
            const res = await provider.call({ data: callData.byteCode });
            expect(res).toMatchSnapshot();
            expect(callData.byteCode.includes(strip0x(testContractByteCode))).toBeTruthy();
            const result = decodeResult(calls, res);
            expect(result).toMatchSnapshot();
        });

        it('complex', async () => {
            const { data: aPlusBContractByteCode } = await APlusBFactory.getDeployTransaction();
            const { data: testContractByteCode } = await TestContractFactory.getDeployTransaction();

            const calls = [
                await createEthersV6Call(aPlusBContract, 'plus', [1, 2], { withAddress: labeledAddress('a') }),
                await createEthersV6Call(aPlusBContract, 'plus', [3, 4], { withAddress: labeledAddress('b') }),
                await createEthersV6Call(aPlusBContract, 'minus', [5, 6], { withAddress: labeledAddress('c') }),

                await createEthersV6Call(testContract, 'compare', [1, 2], { withAddress: labeledAddress('x') }),
                await createEthersV6Call(testContract, 'swapXY', [{ x: 1, y: 2 }], {
                    withAddress: labeledAddress('y'),
                }),
                await createEthersV6Call(testContract, 'hash', [1], { withAddress: labeledAddress('z') }),
            ];

            const callData = buildRawMulticallContract(calls, {
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
            const res = await provider.call({ data: callData.byteCode });
            const decodedResult = decodeResult(calls, res);
            expect(res).toMatchSnapshot();
            expect(decodedResult).toMatchSnapshot();
        });

        it('throw error', async () => {
            const { data: throwErrorContractByteCode } = await ThrowErrorFactory.getDeployTransaction();
            registerPredeployContract('throw-error', throwErrorContractByteCode);
            const calls = [
                await createEthersV6Call(throwErrorContract, 'justRevert', ['abc'], {
                    withAddress: labeledAddress('throw-error'),
                }),
                await createEthersV6Call(throwErrorContract, 'revertError', ['xyz'], {
                    withAddress: labeledAddress('throw-error'),
                }),
                await createEthersV6Call(throwErrorContract, 'revertCustom', [1], {
                    withAddress: labeledAddress('throw-error'),
                }),
                await createEthersV6Call(throwErrorContract, 'revertPanic', [], {
                    withAddress: labeledAddress('throw-error'),
                }),
            ] as const;

            const calldata = buildRawMulticallContract(calls, { allowPUSH0 });
            expect(calldata).toMatchSnapshot();
            const res = await provider.call({ data: calldata.byteCode });
            const decodedRes = decodeResult(calls, res);
            expect(decodedRes).toMatchSnapshot();
        });
    }
);
