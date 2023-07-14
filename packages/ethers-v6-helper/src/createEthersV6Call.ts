import { AddressOrRawAddress, Call, strip0x, add0x, castToAddress } from '@raw-multicall/core';
import { BaseContract } from 'ethers';
import { MethodNames, MethodParameters, MethodReturnType } from './types';
import { NoFragmentFoundError, ContractError } from './error';

export type CreateEthersV6CallParams = {
    withAddress?: AddressOrRawAddress;
};

export async function createEthersV6Call<C extends BaseContract, const Method extends MethodNames<C>>(
    contract: C,
    methodName: Method,
    methodParams: MethodParameters<C, Method>,
    params: CreateEthersV6CallParams = {}
): Promise<Call<MethodReturnType<C, Method>, unknown>> {
    const address = castToAddress(params.withAddress != undefined ? params.withAddress : await contract.getAddress());
    // eslint-disable-next-line
    const data = (await (contract as any)[methodName].populateTransaction(...(methodParams as any))).data as string;
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
                if (!fragment) return new NoFragmentFoundError(data);
                const decodedParams = contract.interface.decodeErrorResult(fragment, add0x(data));
                return new ContractError(fragment, decodedParams, data);
            } catch (e) {
                return e;
            }
        },
    };
}
