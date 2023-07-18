import { Bytes } from './Bytes';
import { AddressOrRawAddress, LabeledAddress } from './Address';

export type BuildRawMulticallContext = {
    getBuildingContractAddress(): Bytes;
    getLabeledAddressSalt(label: LabeledAddress['label']): Bytes;
    getLabeledAddress(label: LabeledAddress['label']): Bytes;
    resolveAddress(address: AddressOrRawAddress): Bytes;
};
