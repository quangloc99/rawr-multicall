import { Bytes } from './Bytes';
import { Address, castToAddress, AddressOrRawAddress } from './Address';

export type Call<ResultType, ErrorType> = {
    getContractAddress(): Address;
    getData(): Bytes;
    decodeResult(data: Bytes): ResultType;
    decodeError(data: Bytes): ErrorType;
    getValue(): number;
    getGasLimit(): number | undefined;
};

export type CallParams = {
    gasLimit?: number;
    value?: number;
};

export function wrapCallParams(params?: CallParams) {
    return {
        getValue: () => params?.value ?? 0,
        getGasLimit: () => params?.gasLimit,
    };
}

export function createCall(
    contractAddress: AddressOrRawAddress,
    data: Bytes | string,
    params?: CallParams
): Call<string, string> {
    return {
        getContractAddress: () => castToAddress(contractAddress),
        getData: () => Bytes.from(data),
        decodeResult: (data) => data.toString(),
        decodeError: (data) => data.toString(),
        ...wrapCallParams(params),
    };
}
