import { AddressOrRawAddress, Call, strip0x, add0x, castToAddress } from '@raw-multicall/core';
import { BaseContract } from 'ethers';
import { MethodNames, MethodParameters, MethodReturnType } from './types';
import { NoFragmentFoundError, EthersV5ContractError } from './error';

export type CreateEthersV6CallParams = {
    withAddress?: AddressOrRawAddress;
};

export function createEthersV6Call<C extends BaseContract, const Method extends MethodNames<C>>(
    contract: C,
    methodName: Method,
    methodParams: MethodParameters<C, Method>,
    params: CreateEthersV6CallParams = {}
): Call<MethodReturnType<C, Method>, unknown> {
    const address = castToAddress(params.withAddress != undefined ? params.withAddress : contract.address);
    const data = contract.interface.encodeFunctionData(methodName, methodParams);
    type ReturnType = MethodReturnType<C, Method>;
    return {
        getContractAddress: () => address,
        getData: () => data,
        decodeResult(data): ReturnType {
            const res = contract.interface.decodeFunctionResult(methodName, data);
            if (res.length == 1) return res[0] as ReturnType;
            return res as ReturnType;
        },
        decodeError(data): unknown {
            try {
                const fragment = contract.interface.getError(add0x(strip0x(data).slice(0, 8)));
                const decodedParams = contract.interface.decodeErrorResult(fragment, add0x(data));
                return new EthersV5ContractError(fragment, decodedParams, data);
            } catch (e: unknown) {
                // The only clue for us that ethers can not decode the error
                // is base on the message.
                if (e instanceof Error && e.message.includes('no matching error')) {
                    return new NoFragmentFoundError(data);
                }
                return e;
            }
        },
    };
}
