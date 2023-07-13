import { describeForChain, CHAIN_ID_MAPPING } from '@raw-multicall/test-helper';
import { ethers } from 'ethers';
import { APlusB__factory, APlusB } from './typechain-types';
import { labeledAddress, buildRawMulticallContract, createCall, decodeRawResult } from '../src';

describeForChain(
    (chain: number) => `Test predeploy contracts for chain ${chain}`,
    (rpcUrl, chain) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const APlusBFactory = new APlusB__factory();
        const APlusBIface = new ethers.Interface(APlusB__factory.abi) as APlusB['interface'];
        const allowPUSH0 = chain !== CHAIN_ID_MAPPING.ARBITRUM;

        it('simple', async () => {
            const calls = [
                createCall(labeledAddress('testContract'), APlusBIface.encodeFunctionData('plus', [10, 20])),
                createCall(labeledAddress('testContract'), APlusBIface.encodeFunctionData('minus', [10, 20])),
            ];
            const callData = buildRawMulticallContract(calls, {
                allowPUSH0,
                predeployContracts: {
                    testContract: (await APlusBFactory.getDeployTransaction()).data,
                },
            });
            expect(callData).toMatchSnapshot();
            const res = await provider.call({ data: callData.byteCode });
            expect(res).toMatchSnapshot();
            const result = decodeRawResult(res);
            expect(result).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('plus', result[0].data)).toMatchSnapshot();
            expect(APlusBIface.decodeFunctionResult('minus', result[1].data)).toMatchSnapshot();
        });
    }
);
