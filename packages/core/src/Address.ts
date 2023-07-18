import { toBytes, Bytes, concatBytes, byte } from './Bytes';
import { assert } from './errors';

import { keccak256 } from 'ethereum-cryptography/keccak';
import * as rlp from 'rlp';

export type RawAddressString = string | Bytes;
export type AddressString = {
    type: 'string';
    address: Bytes;
};

export type LabeledAddress = {
    type: 'labeled';
    label: string;
};

export type Address = AddressString | LabeledAddress;
export type AddressOrRawAddress = Address | RawAddressString;

export const labeledAddress = (label: LabeledAddress['label']): LabeledAddress => ({
    type: 'labeled',
    label,
});

export const castToAddress = (address: AddressOrRawAddress): Address =>
    typeof address == 'string' || address instanceof Uint8Array
        ? { type: 'string', address: toBytes(address) }
        : address;

export function calculateCreateAddress(senderAddress: Bytes, nonce: number): Bytes {
    assert(senderAddress.length == 20, 'senderAddress for CREATE should have length of 20');
    return keccak256(rlp.encode([senderAddress, nonce])).slice(12);
}

export function calculateCreate2Address(senderAddress: Bytes, initCode: Bytes, salt: Bytes) {
    assert(salt.length == 32, 'salt for create2 contract should have length of 32');
    assert(senderAddress.length == 20, 'senderAddress for CREATE2 should have length of 20');
    return keccak256(concatBytes([byte(0xff), senderAddress, salt, keccak256(initCode)])).slice(12);
}
