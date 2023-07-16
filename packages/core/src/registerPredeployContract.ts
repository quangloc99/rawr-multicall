import { Bytes } from './Bytes';
import { LabeledAddress } from './Address';
export let registeredPredeployContracts: Partial<Record<LabeledAddress['label'], Bytes>> = {};

export function registerPredeployContract(label: LabeledAddress['label'], bytecode: Bytes | string) {
    registeredPredeployContracts[label] = Bytes.from(bytecode);
}

export function resetPredeployContracts() {
    registeredPredeployContracts = {};
}
