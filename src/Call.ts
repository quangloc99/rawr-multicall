import { Bytes } from './bytes';
import { Address, castToAddress, AddressOrRawAddress } from './Address';

export type Call<ResultType, ErrorType> = {
    getContractAddress(): Address;
    getData(): Bytes;
    decodeResult(data: Bytes): ResultType;
    decodeError(data: Bytes): ErrorType;
};

export function createCall(contractAddress: AddressOrRawAddress, data: Bytes): Call<Bytes, Bytes> {
    return {
        getContractAddress: () => castToAddress(contractAddress),
        getData: () => data,
        decodeResult: (data) => data,
        decodeError: (data) => data,
    };
}
