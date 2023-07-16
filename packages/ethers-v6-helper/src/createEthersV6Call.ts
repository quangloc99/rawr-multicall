import { AddressOrRawAddress, Call, Bytes, castToAddress } from '@raw-multicall/core';
import { BaseContract } from 'ethers';
import { MethodNames, MethodParameters, MethodReturnType } from './types';
import { NoFragmentFoundError, EthersV6ContractError } from './error';

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
    const data = Bytes.from(contract.interface.encodeFunctionData(methodName, methodParams));
    type ReturnType = MethodReturnType<C, Method>;
    return {
        getContractAddress: () => address,
        getData: () => data,
        decodeResult(data): ReturnType {
            const res = contract.interface.decodeFunctionResult(methodName, data.toString());
            if (res.length == 1) return res[0] as ReturnType;
            return res as ReturnType;
        },
        decodeError(data): unknown {
            try {
                const fragment = contract.interface.getError(data.slice(0, 4).toString());
                if (!fragment) return new NoFragmentFoundError(data);
                const decodedParams = contract.interface.decodeErrorResult(fragment, data.toString());
                return new EthersV6ContractError(fragment, decodedParams, data);
            } catch (e) {
                return e;
            }
        },
    };
}
