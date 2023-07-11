import { Bytes } from './bytes';

export type Call<ResultType, ErrorType> = {
    getContractAddress(): Bytes;
    getData(): Bytes;
    decodeResult(data: Bytes): ResultType;
    decodeError(data: Bytes): ErrorType;
};

export function createCall(contractAddress: Bytes, data: Bytes): Call<Bytes, Bytes> {
    return {
        getContractAddress: () => contractAddress,
        getData: () => data,
        decodeResult: (data) => data,
        decodeError: (data) => data,
    };
}
