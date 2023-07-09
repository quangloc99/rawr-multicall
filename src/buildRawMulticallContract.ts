import { Call } from './Call';
import { Bytes, concat, byteLength } from './bytes';
import * as ins from './instructions';
import { buildContract, InstructionContextParams } from './buildContract';

export function buildMulticallContract(calls: Call[], params?: InstructionContextParams): Bytes {
    const instructions = buildRawMulticallInstructions(calls);
    return buildContract(instructions, params);
}

export function buildRawMulticallInstructions(calls: Call[]): ins.Instruction[] {
    const instructions: ins.Instruction[] = [];

    let totalDataSize = 0;

    const LABELS = {
        dataStart: 'data-start',
    };

    const FREE_MEMORY_START = 0x80;

    // manipulate this number on stack instead of loading right from memory
    instructions.push(ins.PUSH_NUMBER(FREE_MEMORY_START));

    for (const call of calls) {
        const curDataOffset = totalDataSize;
        const curDataSize = byteLength(call.data);
        totalDataSize += curDataSize;

        // stack: [free_memory_start]

        // copy data to memory
        // use CODECOPY as the data will be appended right after the creation code.
        instructions.push(
            ins.PUSH_NUMBER(curDataSize), // size
            ins.PUSH_NUMBER(curDataOffset), // offset
            ins.MLOAD_OFFSET(FREE_MEMORY_START),
            ins.CODECOPY
        );

        // stack: [free_memory_start]

        // make call
        instructions.push(
            ins.PUSH0, // retSize
            ins.PUSH0, // retOffset
            ins.PUSH_NUMBER(curDataSize), // argsSize
            ins.DUP(4), // argsOffset = free_memory_start
            ins.PUSH0, // value
            ins.PUSH_ADDRESS(call.contractAddress),
            ins.GAS,
            ins.CALL
        );

        // stack: [free_memory_start, call_success]

        // write success state to result
        {
            instructions.push(ins.DUP(2));
            // stack: [free_memory_start, call_success, free_memory_start]
            instructions.push(ins.MSTORE8);
            // stack: [free_memory_start]

            // call_success is written as 1 byte. Increase free_memory_part by 1
            instructions.push(ins.PUSH_NUMBER(1), ins.ADD);
        }
        // stack: [free_memory_start]

        // write the return data to memory
        {
            instructions.push(
                ins.RETURNDATASIZE, // size
                ins.PUSH0, // offset
                ins.DUP(3), // destOffset = free_memory_start
                ins.RETURNDATACOPY
            );

            // stack: [free_memory_start]

            // Data is written. Increase free_memory_start
            instructions.push(ins.RETURNDATASIZE, ins.ADD);
        }

        // stack: [free_memory_start].

        // The stack state **should** be the same as the beginning of the cycle.
    }

    // stack: [free_memory_start]

    // return the result
    {
        // get the size
        instructions.push(ins.PUSH_NUMBER(FREE_MEMORY_START), ins.SUB);
        // stack: [return_data_size]
        instructions.push(ins.PUSH_NUMBER(FREE_MEMORY_START));
        // stack: [return_data_size, start_of_return_data]
        instructions.push(ins.RETURN);
    }

    const data = concat(calls.map(({ data }) => data));
    instructions.push(ins.LABEL(LABELS.dataStart, { isEmpty: true }));
    instructions.push(ins.VERBATIM(data));
    return instructions;
}
