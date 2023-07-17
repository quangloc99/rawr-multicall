import { registerPredeployContract } from '@raw-multicall/core';
import { CallThenRevertContractArtifact } from './CallThenRevertContractArtifact';

export const CallAndRevertContractLabel = Symbol('CallThenRevert');
export function registerPredeployCallThenRevert() {
    registerPredeployContract(CallAndRevertContractLabel, CallThenRevertContractArtifact.bytecode);
}
