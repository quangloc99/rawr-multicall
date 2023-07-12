import { Call } from './Call';
import { byteLength, Bytes } from './bytes';
import * as ins from './instructions';
import { buildContract, InstructionContextParams } from './buildContract';
import { SIGN_BIT, LENGTH_SHIFT, LENGTH_SIZE_bytes, FREE_MEMORY_START, WORD_SIZE_bytes } from './constants';
import { CalldataJoiner, groupedCalldataJoiner } from './CalldataJoiner';
import { prefixSum, zip } from './util';
import { assertDefined } from './errors';
import { Address } from './Address';

export type BuildRawMulticallContractParams = InstructionContextParams & {
    calldataJoiner?: CalldataJoiner;
    predeployContracts?: Partial<Record<string, Bytes>>;
};

export function buildRawMulticallContract<Calls extends readonly Call<unknown, unknown>[]>(
    calls: Calls,
    params?: BuildRawMulticallContractParams
) {
    const instructions = buildRawMulticallInstructions(calls, params);
    return buildContract(instructions, params);
}

export function buildRawMulticallInstructions<Calls extends readonly Call<unknown, unknown>[]>(
    calls: Calls,
    params?: BuildRawMulticallContractParams
): ins.Instruction[] {
    const { calldataJoiner = groupedCalldataJoiner, predeployContracts = {} } = params ?? {};
    const instructions: ins.Instruction[] = [];

    const LABELS = {
        // This label will be pushed in the very end.
        dataStart: 'data-start',
    };

    const callData = calls.map((call) => ({
        data: call.getData(),
        contractAddress: call.getContractAddress(),
    }));
    const usedPredeployContracts = new Map<string, { bytecode: Bytes; id: number }>(
        callData
            .flatMap(({ contractAddress }) => (contractAddress.type == 'labeled' ? [contractAddress.label] : []))
            .map((label, id) => {
                const res = predeployContracts[label];
                return [
                    label,
                    {
                        bytecode: assertDefined(res, `There is no predeploy contract with label ${label}`),
                        id,
                    },
                ];
            })
    );

    const joinedCalldata = calldataJoiner.join(callData.map(({ data }) => data));
    const joinedPredeployContractsByteCode = calldataJoiner.join(
        Array.from(usedPredeployContracts.values(), ({ bytecode }) => bytecode)
    );
    const totalDataSize = byteLength(joinedCalldata.result) + byteLength(joinedPredeployContractsByteCode.result);

    // memory layout
    const [predeployContractBytecodeOffset, dataOffset, predeployContractAddressesOffset, RETURN_DATA_START] =
        prefixSum([
            FREE_MEMORY_START,
            byteLength(joinedPredeployContractsByteCode.result),
            byteLength(joinedCalldata.result),
            usedPredeployContracts.size * WORD_SIZE_bytes,
        ]);

    // copy ALL data to memory
    // use CODECOPY as the data will be appended right after the creation code.
    instructions.push(
        ins.PUSH_NUMBER(totalDataSize), // size
        ins.PUSH_LABEL('data-start'), // offset. This label is mark at the end of this function.
        ins.PUSH_NUMBER(FREE_MEMORY_START), // destOffset
        ins.CODECOPY
    );

    // deploy contract and save to memory
    for (const [i, { offset, size }] of joinedPredeployContractsByteCode.parts.entries()) {
        // deploy contract
        instructions.push(
            ins.PUSH_NUMBER(size),
            ins.PUSH_NUMBER(offset + predeployContractBytecodeOffset),
            ins.PUSH0, // value
            ins.CREATE
        );
        // stack state: [contract_address]

        // save to memory
        instructions.push(ins.MSTORE_OFFSET(predeployContractAddressesOffset + WORD_SIZE_bytes * i));
        // stack state: []
    }

    // convenient constant(s)
    instructions.push(ins.PUSH_NUMBER(SIGN_BIT), ins.PUSH_NUMBER(LENGTH_SHIFT), ins.PUSH_NUMBER(LENGTH_SIZE_bytes));

    // manipulate this number on stack instead of loading right from memory
    instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START));

    // we maintain the end of the current return data
    // stack: [sign_bit, length_shift, length_size, return_data_end]

    const wrappedPushAddress = (addr: Address) => {
        if (addr.type == 'string') return [ins.PUSH_ADDRESS(addr.address)];
        const id = assertDefined(usedPredeployContracts.get(addr.label)?.id);
        return [ins.MLOAD_OFFSET(id * WORD_SIZE_bytes + predeployContractAddressesOffset)];
    };

    for (const [call, currentPart] of zip(callData, joinedCalldata.parts)) {
        const curDataOffset = dataOffset + currentPart.offset;
        const curDataSize = currentPart.size;

        // stack: [sign_bit, length_shift, length_size, return_data_end]

        // make call
        instructions.push(
            ins.PUSH0, // retSize
            ins.PUSH0, // retOffset
            ins.PUSH_NUMBER(curDataSize), // argsSize
            ins.PUSH_NUMBER(curDataOffset), // argsOffset
            ins.PUSH0, // value
            ...wrappedPushAddress(call.contractAddress),
            ins.GAS,
            ins.CALL
        );

        // stack: [sign_bit, length_shift, length_size, return_data_end, call_success]

        // write call_success + result length
        {
            // shift call_success to be the most significant bit
            instructions.push(
                ins.DUP(5), // shift=sign_bit
                ins.SHL
            );
            // stack: [sign_bit, length_shift, length_size, return_data_end, shifted_call_success]

            instructions.push(ins.RETURNDATASIZE);
            // stack: [sign_bit, length_shift, length_size, return_data_end, shifted_call_success, current_return_data_size]

            // shift current_return_data_size to fit LENGTH_SIZE
            instructions.push(
                ins.DUP(5), // shift=length_shift
                ins.SHL
            );
            // stack: [sign_bit, length_shift, length_size, return_data_end, shifted_call_success, shifted_current_return_data_size]

            // combine
            instructions.push(ins.ADD);
            // stack: [sign_bit, length_shift, length_size, return_data_end, shifted_call_success + shifted_current_return_data_size]

            // write
            instructions.push(
                ins.DUP(2), // offset=return_data_end
                ins.MSTORE
            );
            // stack: [sign_bit, length_shift, length_size, return_data_end]

            // increase return_data_end by 32
            instructions.push(ins.DUP(2), ins.ADD);
            // stack: [sign_bit, length_shift, length_size, return_data_end]
        }

        // write the return data to memory
        {
            instructions.push(
                ins.RETURNDATASIZE, // size
                ins.PUSH0, // offset
                ins.DUP(3), // destOffset = return_data_end
                ins.RETURNDATACOPY
            );
            // stack: [sign_bit, length_shift, length_size, return_data_end]

            // Data is written. Increase return_data_end.
            instructions.push(ins.RETURNDATASIZE, ins.ADD);
            // stack: [sign_bit, length_shift, length_size, return_data_end]
        }

        // The stack state **should** be the same as the beginning of the cycle.
    }

    // stack: [sign_bit, length_shift, length_size, return_data_end]

    // return the result
    {
        // get the size
        instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START), ins.SWAP(1), ins.SUB);
        // stack: [sign_bit, length_shift, length_size, return_data_size]
        instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START));
        // stack: [sign_bit, length_shift, length_size, return_data_size, start_of_return_data]
        instructions.push(ins.RETURN);
        // stack: [sign_bit, length_shift, length_size]
    }

    instructions.push(ins.LABEL(LABELS.dataStart, { isEmpty: true }));
    instructions.push(ins.VERBATIM(joinedPredeployContractsByteCode.result));
    instructions.push(ins.VERBATIM(joinedCalldata.result));
    return instructions;
}
