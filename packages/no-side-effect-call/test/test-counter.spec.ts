import { describeForChain } from '@rawr-multicall/test-helper';
import { Counter__factory } from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types';
import { createEthersV6Call } from '@rawr-multicall/ethers-v6-helper';
import { ethers } from 'ethers';
import { buildRawMulticallContract, decodeRawResult, decodeResult, labeledAddress, unwrap } from '@rawr-multicall/core';
import { wrapNoSideEffectCall } from '../src';

describeForChain(
    (chain: number) => `Test counter for chain ${chain}`,
    (rpcUrl) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = Counter__factory.connect(ethers.ZeroAddress);

        it('test counter', async () => {
            const label = 'test-counter';
            const testContractAddress = labeledAddress(label);
            const calls = [
                await createEthersV6Call(contract, 'counter', [], { withAddress: testContractAddress }),
                await createEthersV6Call(contract, 'inc', [], { withAddress: testContractAddress }),
                await createEthersV6Call(contract, 'counter', [], { withAddress: testContractAddress }),
                wrapNoSideEffectCall(
                    await createEthersV6Call(contract, 'inc', [], { withAddress: testContractAddress })
                ),
                await createEthersV6Call(contract, 'counter', [], { withAddress: testContractAddress }),
                await createEthersV6Call(contract, 'inc', [], { withAddress: testContractAddress }),
                await createEthersV6Call(contract, 'counter', [], { withAddress: testContractAddress }),
            ] as const;
            const calldata = buildRawMulticallContract(calls, {
                predeployContracts: {
                    [label]: (await new Counter__factory().getDeployTransaction()).data,
                },
            });
            expect(calldata).toMatchSnapshot('calldata');
            const rawResult = await provider.call({ data: calldata.byteCode.toString() });
            expect(rawResult).toMatchSnapshot('rawResult');
            expect(decodeRawResult(rawResult)).toMatchSnapshot('decodedRawResult');
            const result = decodeResult(calls, rawResult);
            expect(unwrap(result[0])).toBe(0n); // counter
            expect(unwrap(result[1])).toBe(1n); // inc
            expect(unwrap(result[2])).toBe(1n); // counter
            expect(unwrap(result[3])).toBe(2n); // no side effect inc
            expect(unwrap(result[4])).toBe(1n); // counter
            expect(unwrap(result[5])).toBe(2n); // inc
            expect(unwrap(result[6])).toBe(2n); // counter
        });
    }
);
