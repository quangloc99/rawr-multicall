export type RawAddressString = string;
export type AddressString = {
    type: 'string';
    address: RawAddressString;
};

export type LabeledAddress = {
    type: 'labeled';
    label: string | symbol;
};

export type Address = AddressString | LabeledAddress;
export type AddressOrRawAddress = Address | RawAddressString;

export const labeledAddress = (label: LabeledAddress['label']): LabeledAddress => ({
    type: 'labeled',
    label,
});

export const castToAddress = (address: AddressOrRawAddress): Address =>
    typeof address == 'string' ? { type: 'string', address: address } : address;
