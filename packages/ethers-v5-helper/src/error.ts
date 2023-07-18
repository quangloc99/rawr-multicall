import { Bytes, RawMulticallError, assert, equalsBytes, hexToBytes, bytesToHexWith0x } from '@raw-multicall/core';
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
    static readonly ERROR_FRAGMENT = hexToBytes('0x08c379a0');
    static checkBytesFragment(this: void, bytes: Bytes): boolean {
        return equalsBytes(bytes.slice(0, 4), EthersV5ErrorContractError.ERROR_FRAGMENT);
    }

    readonly msg: string;
    constructor(
        readonly data: Bytes,
        options?: ErrorOptions
    ) {
        assert(EthersV5ErrorContractError.checkBytesFragment(data));
        const [msg] = ethers.utils.defaultAbiCoder.decode(['string'], bytesToHexWith0x(data.slice(4)));
        super(`Error(${JSON.stringify(msg)})`, options);
        this.msg = msg as string;
    }
}

export class EthersV5PanicContractError extends RawMulticallEthersV5HelperError {
    static readonly ERROR_FRAGMENT = hexToBytes('0x4e487b71');
    // https://ethereum.stackexchange.com/a/128807
    static checkBytesFragment(bytes: Bytes): boolean {
        return equalsBytes(bytes.slice(0, 4), this.ERROR_FRAGMENT);
    }

    readonly code: BigNumber;
    constructor(
        readonly data: Bytes,
        options?: ErrorOptions
    ) {
        assert(EthersV5PanicContractError.checkBytesFragment(data));
        const [code] = ethers.utils.defaultAbiCoder.decode(['uint256'], bytesToHexWith0x(data.slice(4)));
        super(`Panic(${code})`, options);
        this.code = BigNumber.from(code);
    }
}
