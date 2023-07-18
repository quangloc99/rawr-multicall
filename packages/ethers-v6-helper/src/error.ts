import { Bytes, RawMulticallError, bytesToHexWith0x } from '@raw-multicall/core';
import { ErrorFragment } from 'ethers';

export class NoFragmentFoundError extends RawMulticallError {
    constructor(
        readonly data: Bytes,
        message: string = `No error fragment found for reverted data "${bytesToHexWith0x(data)}"`,
        options?: ErrorOptions
    ) {
        super(message, options);
    }
}

export class EthersV6ContractError extends RawMulticallError {
    constructor(
        readonly fragment: ErrorFragment,
        readonly decodedParams: unknown[],
        readonly data: Bytes,
        options?: ErrorOptions
    ) {
        super(`${fragment.name}(${EthersV6ContractError.joinParams(decodedParams)})`, options);
    }

    static joinParams(params: unknown[]) {
        return params.map((value) => (typeof value == 'bigint' ? value : JSON.stringify(value))).join(', ');
    }
}
