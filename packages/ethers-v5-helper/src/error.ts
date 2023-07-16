import { Bytes, RawMulticallError, assert } from '@raw-multicall/core';
import { BigNumber, ethers } from 'ethers';
import type { ErrorFragment, Result } from '@ethersproject/abi';

export class RawMulticallEthersV5HelperError extends RawMulticallError {}

export class NoFragmentFoundError extends RawMulticallEthersV5HelperError {
    constructor(
        readonly data: Bytes,
        message: string = `No error fragment found for reverted data "${data.toString()}"`,
        options?: ErrorOptions
    ) {
        super(message, options);
    }
}

export class EthersV5ContractError extends RawMulticallEthersV5HelperError {
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

// Wrapper for `Error(msg)` error
export class EthersV5ErrorContractError extends RawMulticallEthersV5HelperError {
    // https://ethereum.stackexchange.com/a/128807
    static checkBytesFragment(bytes: Bytes): boolean {
        return bytes.slice(0, 4).toString().startsWith('0x08c379a0');
    }

    readonly msg: string;
    constructor(
        readonly data: Bytes,
        options?: ErrorOptions
    ) {
        assert(EthersV5ErrorContractError.checkBytesFragment(data));
        const [msg] = ethers.utils.defaultAbiCoder.decode(['string'], data.slice(4).toString());
        super(`Error(${JSON.stringify(msg)})`, options);
        this.msg = msg as string;
    }
}

export class EthersV5PanicContractError extends RawMulticallEthersV5HelperError {
    // https://ethereum.stackexchange.com/a/128807
    static checkBytesFragment(bytes: Bytes): boolean {
        return bytes.slice(0, 4).toString().startsWith('0x4e487b71');
    }

    readonly code: BigNumber;
    constructor(
        readonly data: Bytes,
        options?: ErrorOptions
    ) {
        assert(EthersV5PanicContractError.checkBytesFragment(data));
        const [code] = ethers.utils.defaultAbiCoder.decode(['uint256'], data.slice(4).toString());
        super(`Panic(${code})`, options);
        this.code = BigNumber.from(code);
    }
}
