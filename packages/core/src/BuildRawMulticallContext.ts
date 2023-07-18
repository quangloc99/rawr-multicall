import { Bytes } from './Bytes';
import { AddressOrRawAddress } from './Address';

export type BuildRawMulticallContext = {
    resolveAddress(address: AddressOrRawAddress): Bytes;
};
