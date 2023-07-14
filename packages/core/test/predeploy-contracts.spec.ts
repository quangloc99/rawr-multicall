import { describeForChain, CHAIN_ID_MAPPING } from '@raw-multicall/test-helper';
import { ethers } from 'ethers';
import { APlusB__factory } from '@raw-multicall/test-helper/typechain-types-ethers-v6';
import { APlusBInterface } from '@raw-multicall/test-helper/typechain-types-ethers-v6/APlusB';
import {
    labeledAddress,
    buildRawMulticallContract,
    createCall,
    decodeRawResult,
    NoPredeployContractError,
    resetPredeployContracts,
    registerPredeployContract,
    strip0x,
} from '../src';

describeForChain(
    (chain: number) => `Test predeploy contracts for chain ${chain}`,
    (rpcUrl, chain) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const APlusBFactory = new APlusB__factory();
        const APlusBIface = new ethers.Interface(APlusB__factory.abi) as unknown as APlusBInterface;
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
            const res = await provider.call({ data: callData.byteCode });
            expect(res).toMatchSnapshot();
            expect(callData.byteCode.includes(strip0x(testContract)));
            const result = decodeRawResult(res);
            expect(result).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('plus', result[0].data)).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('minus', result[1].data)).toMatchSnapshot();
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
            expect(callData.byteCode.includes(strip0x(myContract)));
            const res = await provider.call({ data: callData.byteCode });
            expect(res).toMatchSnapshot();
            const result = decodeRawResult(res);
            expect(result).toMatchSnapshot();
        });
    }
);
