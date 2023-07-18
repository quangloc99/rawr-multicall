import { Bytes, toBytes } from './Bytes';
import { LabeledAddress } from './Address';
export let registeredPredeployContracts: Partial<Record<LabeledAddress['label'], Bytes>> = {};

export function registerPredeployContract(label: LabeledAddress['label'], bytecode: Bytes | string) {
    registeredPredeployContracts[label] = toBytes(bytecode);
}

export function resetPredeployContracts() {
    registeredPredeployContracts = {};
}
