import { Bytes } from './Bytes';
import { Address, castToAddress, AddressOrRawAddress } from './Address';

export type Call<ResultType, ErrorType> = {
    getContractAddress(): Address;
    getData(): Bytes;
    decodeResult(data: Bytes): ResultType;
    decodeError(data: Bytes): ErrorType;
};

export function createCall(contractAddress: AddressOrRawAddress, data: Bytes | string): Call<string, string> {
    return {
        getContractAddress: () => castToAddress(contractAddress),
        getData: () => Bytes.from(data),
        decodeResult: (data) => data.toString(),
        decodeError: (data) => data.toString(),
    };
}
