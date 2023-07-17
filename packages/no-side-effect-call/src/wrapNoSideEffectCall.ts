import { Call, labeledAddress, assert, Bytes, RawMulticallError } from '@raw-multicall/core';
import { CallAndRevertContractLabel } from './registerPredeployCallThenRevert';

export function wrapNoSideEffectCall<ReturnType, ErrorType>(
    call: Call<ReturnType, ErrorType>
): Call<ReturnType, ErrorType> {
    return {
        getContractAddress: () => labeledAddress(CallAndRevertContractLabel),
        getData: () => {
            const address = call.getContractAddress();
            if (address.type === 'labeled') {
                throw new RawMulticallError('Labeled address currently can not be used with wrapNoSideEffectCall');
            }
            return Bytes.concat(
                Bytes.fromNumber(call.getGasLimit() ?? 2 ** 32 - 1, 4),
                Bytes.from(address.address),
                call.getData()
            );
        },
        decodeOutput: (success, data) => {
            assert(!success, 'CallAndRevert contract result should not have successful status');
            const actualSuccess = data.slice(0, 1).byteValue(0);
            const actualData = data.slice(1);
            assert(actualSuccess <= 1, 'Actual success must either be 0 or 1');
            return call.decodeOutput(!!actualSuccess, actualData);
        },
        getGasLimit: () => undefined,
        getValue: () => call.getValue(),
    };
}
