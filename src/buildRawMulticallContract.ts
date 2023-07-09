import { Call } from './Call';
import { concat, byteLength } from './bytes';
import * as ins from './instructions';
import { buildContract, InstructionContextParams } from './buildContract';

export function buildRawMulticallContract(calls: Call[], params?: InstructionContextParams) {
    const instructions = buildRawMulticallInstructions(calls);
    return buildContract(instructions, params);
}

export function buildRawMulticallInstructions(calls: Call[]): ins.Instruction[] {
    const instructions: ins.Instruction[] = [];

    const LABELS = {
        dataStart: 'data-start',
    };

    const totalDataSize = calls
        .map(({ data }) => data)
        .map(byteLength)
        .reduce((a, b) => a + b, 0);

    const FREE_MEMORY_START = 0x80;

    // copy ALL data to memory
    // use CODECOPY as the data will be appended right after the creation code.
    instructions.push(
        ins.PUSH_NUMBER(totalDataSize), // size
        ins.PUSH_LABEL('data-start'), // offset
        ins.PUSH_NUMBER(FREE_MEMORY_START), // destOffset
        ins.CODECOPY
    );

    const LENGTH_SIZE = 4; // how many byte to store array length.
    const RETURN_DATA_START = FREE_MEMORY_START + totalDataSize;

    // convenient constant(s)
    instructions.push(ins.PUSH_NUMBER(LENGTH_SIZE));

    // manipulate this number on stack instead of loading right from memory
    instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START));

    // we maintain the end of the current return data
    // stack: [length_size, return_data_end]

    let dataOffset = FREE_MEMORY_START;
    for (const call of calls) {
        const curDataOffset = dataOffset;
        const curDataSize = byteLength(call.data);
        dataOffset += curDataSize;

        // stack: [length_size, return_data_end]

        // make call
        instructions.push(
            ins.PUSH0, // retSize
            ins.PUSH0, // retOffset
            ins.PUSH_NUMBER(curDataSize), // argsSize
            ins.PUSH_NUMBER(curDataOffset), // argsOffset
            ins.PUSH0, // value
            ins.PUSH_ADDRESS(call.contractAddress),
            ins.GAS,
            ins.CALL
        );

        // stack: [length_size, return_data_end, call_success]

        // write success state to result
        {
            instructions.push(ins.DUP(2));
            // stack: [length_size, return_data_end, call_success, return_data_end]
            instructions.push(ins.MSTORE8);
            // stack: [length_size, return_data_end]

            // call_success is written as 1 byte. Increase free_memory_part by 1
            instructions.push(ins.PUSH_NUMBER(1), ins.ADD);
        }
        // stack: [length_size, return_data_end]

        {
            // write the length
            // do shifting to reduce the size
            instructions.push(
                ins.RETURNDATASIZE, // value
                ins.PUSH_NUMBER((32 - LENGTH_SIZE) * 8), // shift
                ins.SHL,
                ins.DUP(2), // offset
                ins.MSTORE
            );

            // increase return_data_end by 32
            instructions.push(ins.DUP(2), ins.ADD);

            // write the return data to memory
            instructions.push(
                ins.RETURNDATASIZE, // size
                ins.PUSH0, // offset
                ins.DUP(3), // destOffset = return_data_end
                ins.RETURNDATACOPY
            );

            // stack: [length_size, return_data_end]

            // Data is written. Increase return_data_end.
            instructions.push(ins.RETURNDATASIZE, ins.ADD);
        }

        // stack: [length_size, return_data_end].

        // The stack state **should** be the same as the beginning of the cycle.
    }

    // stack: [length_size, return_data_end]

    // return the result
    {
        // get the size
        instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START), ins.SWAP(1), ins.SUB);
        // stack: [length_size, return_data_size]
        instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START));
        // stack: [length_size, return_data_size, start_of_return_data]
        instructions.push(ins.RETURN);
    }

    instructions.push(ins.STOP);
    const data = concat(calls.map(({ data }) => data));
    instructions.push(ins.LABEL(LABELS.dataStart, { isEmpty: true }));
    instructions.push(ins.VERBATIM(data));
    return instructions;
}
