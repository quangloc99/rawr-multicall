import { registerPredeployContract } from '@rawr-multicall/core';
import { CallThenRevertContractByteCode } from './CallThenRevertContractArtifact';

export const CallThenRevertContractLabel = '@rawr-multicall/no-side-effect-call/CallThenRevertContract';
export function registerPredeployCallThenRevert() {
    registerPredeployContract(CallThenRevertContractLabel, CallThenRevertContractByteCode);
}
