import { Call, labeledAddress, assert, concatBytes, numberToBytes } from '@raw-multicall/core';
import { CallThenRevertContractLabel } from './registerPredeployCallThenRevert';

export function wrapNoSideEffectCall<ReturnType, ErrorType>(
    call: Call<ReturnType, ErrorType>
): Call<ReturnType, ErrorType> {
    return {
        getContractAddress: () => labeledAddress(CallThenRevertContractLabel),
        getData: (context) => {
            const address = context.resolveAddress(call.getContractAddress(context));
            return concatBytes([
                numberToBytes(call.getGasLimit(context) ?? 2 ** 32 - 1, 4),
                address,
                call.getData(context),
            ]);
        },
        decodeOutput: (success, data) => {
            console.log(data);
            assert(!success, 'CallThenRevert contract result should not have successful status');
            const actualSuccess = data[0];
            const actualData = data.slice(1);
            assert(actualSuccess <= 1, 'Actual success must either be 0 or 1');
            return call.decodeOutput(!!actualSuccess, actualData);
        },
        getGasLimit: () => undefined,
        getValue: (context) => call.getValue(context),
        getDependentLabeledContract: (context) => {
            const addr = call.getContractAddress(context);
            const res = call.getDependentLabeledContract?.(context) ?? [];
            if (typeof addr == 'object' && addr.type == 'labeled') return [...res, addr.label];
            return res;
        },
    };
}
