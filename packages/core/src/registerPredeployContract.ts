import { Bytes } from './bytes';
import { LabeledAddress } from './Address';
export let registeredPredeployContracts: Partial<Record<LabeledAddress['label'], Bytes>> = {};

export function registerPredeployContract(label: LabeledAddress['label'], bytecode: Bytes) {
    registeredPredeployContracts[label] = bytecode;
}

export function resetPredeployContracts() {
    registeredPredeployContracts = {};
}
