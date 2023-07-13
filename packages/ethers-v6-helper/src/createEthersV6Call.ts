import { AddressOrRawAddress, Call, strip0x, add0x, castToAddress } from '@raw-multicall/core';
import { BaseContract } from 'ethers';
import { MethodNames, MethodParameters, MethodReturnType } from './types';
import { NoFragmentFoundError } from './error';

export type CreateEthersV6CallParams = {
    withAddress?: AddressOrRawAddress;
};

export async function createEthersV6Call<
    C extends BaseContract,
    Method extends MethodNames<C>,
    MethodParams = MethodParameters<C, Method>,
    ReturnType = MethodReturnType<C, Method>,
>(
    contract: C,
    methodName: Method,
    methodParams: MethodParams,
    params: CreateEthersV6CallParams = {}
): Promise<Call<ReturnType, unknown>> {
    const address = castToAddress(params.withAddress != undefined ? params.withAddress : await contract.getAddress());
    // eslint-disable-next-line
    const data = (await (contract as any)[methodName].populateTransaction(...(methodParams as any))).data as string;
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
                return contract.interface.decodeErrorResult(fragment, add0x(data));
            } catch (e) {
                return e;
            }
        },
    };
}
