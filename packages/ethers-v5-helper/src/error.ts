import { Bytes, RawMulticallError } from '@raw-multicall/core';
import { BigNumber } from 'ethers';
import type { ErrorFragment, Result } from '@ethersproject/abi';

export class NoFragmentFoundError extends RawMulticallError {
    constructor(
        readonly data: Bytes,
        message: string = `No error fragment found for reverted data "${data}"`,
        options?: ErrorOptions
    ) {
        super(message, options);
    }
}

export class EthersV5ContractError extends RawMulticallError {
    constructor(
        readonly fragment: ErrorFragment,
        readonly decodedParams: Result,
        readonly data: Bytes,
        options?: ErrorOptions
    ) {
        super(`${fragment.name}(${EthersV5ContractError.joinParams(decodedParams)})`, options);
    }

    static joinParams(params: Result) {
        return JSON.stringify(params, (_key, value: unknown) =>
            BigNumber.isBigNumber(value) ? value.toString() : value
        );
    }
}
