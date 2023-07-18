import { registerPredeployContract } from '@raw-multicall/core';
import { CallThenRevertContractArtifact } from './CallThenRevertContractArtifact';

export const CallThenRevertContractLabel = '@raw-multicall/no-side-effect-call/CallThenRevertContract';
export function registerPredeployCallThenRevert() {
    registerPredeployContract(CallThenRevertContractLabel, CallThenRevertContractArtifact.bytecode);
}
