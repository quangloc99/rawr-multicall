import {
    AddressOrRawAddress,
    Call,
    castToAddress,
    wrapCallParams,
    CallParams,
    wrapDecodeOutput,
    toBytes,
    bytesToHexWith0x,
} from '@raw-multicall/core';
import { BaseContract } from 'ethers';
import { MethodNames, MethodParameters, MethodReturnType } from './types';
import {
    NoFragmentFoundError,
    EthersV5ContractError,
    EthersV5ErrorContractError,
    EthersV5PanicContractError,
} from './error';

export type CreateEthersV6CallParams = CallParams & {
    withAddress?: AddressOrRawAddress;
};

export function createEthersV5Call<C extends BaseContract, const Method extends MethodNames<C>>(
    contract: C,
    methodName: Method,
    methodParams: MethodParameters<C, Method>,
    params: CreateEthersV6CallParams = {}
): Call<MethodReturnType<C, Method>, unknown> {
    const address = castToAddress(params.withAddress != undefined ? params.withAddress : contract.address);
    const data = toBytes(contract.interface.encodeFunctionData(methodName, methodParams));
    type ReturnType = MethodReturnType<C, Method>;
    return {
        getContractAddress: () => address,
        getData: () => data,
        ...wrapDecodeOutput({
            decodeResult(data): ReturnType {
                const res = contract.interface.decodeFunctionResult(methodName, bytesToHexWith0x(data));
                if (res.length == 1) return res[0] as ReturnType;
                return res as ReturnType;
            },
            decodeError(data): unknown {
                try {
                    if (EthersV5ErrorContractError.checkBytesFragment(data)) {
                        return new EthersV5ErrorContractError(data);
                    }
                    if (EthersV5PanicContractError.checkBytesFragment(data)) {
                        return new EthersV5PanicContractError(data);
                    }
                    const fragment = contract.interface.getError(bytesToHexWith0x(data.slice(0, 4)));
                    const decodedParams = contract.interface.decodeErrorResult(fragment, bytesToHexWith0x(data));
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
        }),
        ...wrapCallParams(params),
    };
}
