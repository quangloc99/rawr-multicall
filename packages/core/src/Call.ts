import { Bytes } from './Bytes';
import { Address, castToAddress, AddressOrRawAddress } from './Address';
import { type Result } from './Result';

export type Call<ResultType, ErrorType> = {
    getContractAddress(): Address;
    getData(): Bytes;
    decodeOutput(success: boolean, data: Bytes): Result<ResultType, ErrorType>;
    getValue(): number;
    getGasLimit(): number | undefined;
};

export type CallParams = {
    gasLimit?: number;
    value?: number;
};

/**
 * @remarks
 * Previously the interface of `Calls` has `decodeResult` and `decodeError`,
 * but for more advance usage, such as for `no-side-effect-call`, which can
 * also map an unsuccessful output to result.
 *
 * So to make things more composable, this function is introduced.
 * @param partialDecoder
 * @returns
 */
export function wrapDecodeOutput<ResultType, ErrorType>(partialDecoder: {
    decodeResult(data: Bytes): ResultType;
    decodeError(data: Bytes): ErrorType;
}): {
    decodeOutput: (success: boolean, data: Bytes) => Result<ResultType, ErrorType>;
} {
    return {
        decodeOutput: (success: boolean, data: Bytes) =>
            success
                ? { success, result: partialDecoder.decodeResult(data) }
                : { success, error: partialDecoder.decodeError(data) },
    };
}

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
        ...wrapDecodeOutput({
            decodeResult: (data) => data.toString(),
            decodeError: (data) => data.toString(),
        }),
        ...wrapCallParams(params),
    };
}
