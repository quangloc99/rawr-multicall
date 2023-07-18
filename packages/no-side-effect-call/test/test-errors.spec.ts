import { describeForChain, CHAIN_ID_MAPPING } from '@rawr-multicall/test-helper';
import { ethers } from 'ethers';
import { ThrowError__factory } from '@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types';
import {
    labeledAddress,
    buildRawMulticallContract,
    registerPredeployContract,
    decodeResult,
} from '@rawr-multicall/core';
import { createEthersV6Call } from '@rawr-multicall/ethers-v6-helper';
import { wrapNoSideEffectCall } from '../src';

describeForChain(
    (chain: number) => `Test error for chain ${chain}`,
    (rpcUrl, chain) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const ThrowErrorFactory = new ThrowError__factory();
        const throwErrorContract = ThrowError__factory.connect(ethers.ZeroAddress);
        const allowPUSH0 = chain !== CHAIN_ID_MAPPING.ARBITRUM;

        it('Test error', async () => {
            const { data: throwErrorContractByteCode } = await ThrowErrorFactory.getDeployTransaction();
            registerPredeployContract('throw-error', throwErrorContractByteCode);
            const calls = [
                wrapNoSideEffectCall(
                    await createEthersV6Call(throwErrorContract, 'justRevert', ['abc'], {
                        withAddress: labeledAddress('throw-error'),
                    })
                ),
                wrapNoSideEffectCall(
                    await createEthersV6Call(throwErrorContract, 'revertError', ['xyz'], {
                        withAddress: labeledAddress('throw-error'),
                    })
                ),
                wrapNoSideEffectCall(
                    await createEthersV6Call(throwErrorContract, 'revertCustom', [1], {
                        withAddress: labeledAddress('throw-error'),
                    })
                ),
                wrapNoSideEffectCall(
                    await createEthersV6Call(throwErrorContract, 'revertPanic', [], {
                        withAddress: labeledAddress('throw-error'),
                    })
                ),
            ] as const;

            const calldata = buildRawMulticallContract(calls, { allowPUSH0 });
            expect(calldata).toMatchSnapshot();
            const res = await provider.call({ data: calldata.byteCode.toString() });
            const decodedRes = decodeResult(calls, res);
            expect(decodedRes).toMatchSnapshot();
        });
    }
);
