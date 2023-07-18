import { describeForChain, CHAIN_ID_MAPPING, hexStringContains } from '@rawr-multicall/test-helper';
import { ethers } from 'ethers';
import {
    APlusB__factory,
    TestContract__factory,
    ThrowError__factory,
} from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types';
import { APlusBInterface } from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types/APlusB';
import { TestContractInterface } from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types/TestContract';
import { ThrowErrorInterface } from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types/ThrowError';
import {
    labeledAddress,
    buildRawMulticallContract,
    createCall,
    NoPredeployContractError,
    resetPredeployContracts,
    registerPredeployContract,
    decodeResult,
    unwrap,
    getResultError,
} from '../src';

describeForChain(
    (chain: number) => `Test predeploy contracts for chain ${chain}`,
    (rpcUrl, chain) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const APlusBFactory = new APlusB__factory();
        const TestContractFactory = new TestContract__factory();
        const ThrowErrorFactory = new ThrowError__factory();
        const APlusBIface = new ethers.Interface(APlusB__factory.abi) as unknown as APlusBInterface;
        const TestContractInterface = new ethers.Interface(
            TestContract__factory.abi
        ) as unknown as TestContractInterface;
        const ThrowErrorInterface = new ethers.Interface(ThrowError__factory.abi) as unknown as ThrowErrorInterface;
        const allowPUSH0 = chain !== CHAIN_ID_MAPPING.ARBITRUM;

        beforeEach(() => {
            resetPredeployContracts();
        });

        it('simple', async () => {
            const calls = [
                createCall(labeledAddress('testContract'), APlusBIface.encodeFunctionData('plus', [10, 20])),
                createCall(labeledAddress('testContract'), APlusBIface.encodeFunctionData('minus', [10, 20])),
            ];
            const testContract = (await APlusBFactory.getDeployTransaction()).data;
            const callData = buildRawMulticallContract(calls, {
                allowPUSH0,
                predeployContracts: { testContract },
            });
            expect(callData).toMatchSnapshot();
            const res = await provider.call({ data: callData.byteCode.toString() });
            expect(res).toMatchSnapshot();
            expect(hexStringContains(callData.byteCode, testContract)).toBeTruthy();
            const result = decodeResult(calls, res);
            expect(result).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('plus', unwrap(result[0]))).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('minus', unwrap(result[1]))).toMatchSnapshot();
        });

        it('complex', async () => {
            const { data: aPlusBContract } = await APlusBFactory.getDeployTransaction();
            const { data: testContract } = await TestContractFactory.getDeployTransaction();

            const calls = [
                createCall(labeledAddress('a'), APlusBIface.encodeFunctionData('plus', [1, 2])),
                createCall(labeledAddress('b'), APlusBIface.encodeFunctionData('plus', [3, 4])),
                createCall(labeledAddress('c'), APlusBIface.encodeFunctionData('minus', [5, 6])),

                createCall(labeledAddress('x'), TestContractInterface.encodeFunctionData('compare', [1, 2])),
                createCall(labeledAddress('y'), TestContractInterface.encodeFunctionData('swapXY', [{ x: 1, y: -1 }])),
                createCall(labeledAddress('z'), TestContractInterface.encodeFunctionData('hash', [12345])),
            ];

            const callData = buildRawMulticallContract(calls, {
                allowPUSH0,
                predeployContracts: {
                    a: aPlusBContract,
                    b: aPlusBContract,
                    c: aPlusBContract,
                    x: testContract,
                    y: testContract,
                    z: testContract,
                },
                create2SaltPrefix: 'test-salt-',
            });

            expect(callData).toMatchSnapshot();
            const res = await provider.call({ data: callData.byteCode.toString() });
            const decodedResult = decodeResult(calls, res);
            expect(res).toMatchSnapshot();
            expect(decodedResult).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('plus', unwrap(decodedResult[0]))).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('plus', unwrap(decodedResult[1]))).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('minus', unwrap(decodedResult[2]))).toMatchSnapshot();

            expect(TestContractInterface.decodeFunctionResult('compare', unwrap(decodedResult[3]))).toMatchSnapshot();
            expect(TestContractInterface.decodeFunctionResult('swapXY', unwrap(decodedResult[4]))).toMatchSnapshot();
            expect(TestContractInterface.decodeFunctionResult('hash', unwrap(decodedResult[5]))).toMatchSnapshot();
        });

        it('no predeployed', () => {
            registerPredeployContract('existing-contract', '0x');
            const calls = [createCall(labeledAddress('non-existing'), '0x')];
            expect(() => buildRawMulticallContract(calls)).toThrowError(NoPredeployContractError);
        });

        it('register predeploy contract', async () => {
            const calls = [
                createCall(labeledAddress('my-contract'), APlusBIface.encodeFunctionData('plus', [69, 420])),
            ];
            const myContract = (await APlusBFactory.getDeployTransaction()).data;
            registerPredeployContract('my-contract', myContract);
            const callData = buildRawMulticallContract(calls, {
                allowPUSH0,
            });
            expect(callData).toMatchSnapshot();
            expect(hexStringContains(callData.byteCode, myContract)).toBeTruthy();
            const res = await provider.call({ data: callData.byteCode.toString() });
            expect(res).toMatchSnapshot();
            const result = decodeResult(calls, res);
            expect(result).toMatchSnapshot();
        });

        it('strip unused contract', async () => {
            const aPlusB = (await APlusBFactory.getDeployTransaction()).data;
            const testContract = (await TestContractFactory.getDeployTransaction()).data;
            registerPredeployContract('a-plus-b', aPlusB);
            registerPredeployContract('test-contract', testContract);

            const calldata1 = buildRawMulticallContract([createCall(labeledAddress('a-plus-b'), '0x')]);
            const calldata2 = buildRawMulticallContract([createCall(labeledAddress('test-contract'), '0x')]);

            expect(hexStringContains(calldata1.byteCode, aPlusB)).toBeTruthy();
            expect(hexStringContains(calldata1.byteCode, testContract)).toBeFalsy();

            expect(hexStringContains(calldata2.byteCode, aPlusB)).toBeFalsy();
            expect(hexStringContains(calldata2.byteCode, testContract)).toBeTruthy();
        });

        it('throw error', async () => {
            const { data: throwErrorContractByteCode } = await ThrowErrorFactory.getDeployTransaction();
            registerPredeployContract('throw-error', throwErrorContractByteCode);
            const calls = [
                createCall(
                    labeledAddress('throw-error'),
                    ThrowErrorInterface.encodeFunctionData('justRevert', ['abc'])
                ),
                createCall(
                    labeledAddress('throw-error'),
                    ThrowErrorInterface.encodeFunctionData('revertError', ['xyz'])
                ),
                createCall(labeledAddress('throw-error'), ThrowErrorInterface.encodeFunctionData('revertCustom', [1])),
                createCall(labeledAddress('throw-error'), ThrowErrorInterface.encodeFunctionData('revertPanic')),
            ];

            const calldata = buildRawMulticallContract(calls, { allowPUSH0 });
            expect(calldata).toMatchSnapshot();
            const res = await provider.call({ data: calldata.byteCode.toString() });
            const decodedRes = decodeResult(calls, res);
            expect(decodedRes).toMatchSnapshot();
            expect(ThrowErrorInterface.decodeErrorResult('Error', getResultError(decodedRes[1]))).toMatchSnapshot();
            expect(
                ThrowErrorInterface.decodeErrorResult('CustomError', getResultError(decodedRes[2]))
            ).toMatchSnapshot();
            expect(ThrowErrorInterface.decodeErrorResult('Panic', getResultError(decodedRes[3]))).toMatchSnapshot();
        });
    }
);
