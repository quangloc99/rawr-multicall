import { InstructionContext, PreprocessingInstructionContext } from './InstructionContext';
import { Bytes, concat, byte, byteLength, strip0x } from './bytes';
import { assert } from './errors';
import { toHex } from './util';

export interface Instruction {
    register?: (context: PreprocessingInstructionContext) => void;
    byteSize(context: PreprocessingInstructionContext): number;
    generate(context: InstructionContext): Bytes;
}

export function singleByteInstruction(code: number): Instruction {
    return {
        byteSize: () => 1,
        generate: () => byte(code),
    };
}

export function joinInstructions(...instructions: Instruction[]): Instruction {
    return {
        byteSize: (context) => instructions.map((ins) => ins.byteSize(context)).reduce((a, b) => a + b),
        generate: (context) => concat(...instructions.map((ins) => ins.generate(context))),
    };
}

// https://www.evm.codes/

export const PUSH0 = singleByteInstruction(0x5f);
export const GAS = singleByteInstruction(0x5a);
export const CODECOPY = singleByteInstruction(0x39);
export const RETURNDATASIZE = singleByteInstruction(0x3d);
export const RETURNDATACOPY = singleByteInstruction(0x3e);
export const CALL = singleByteInstruction(0xf1);
export const MLOAD = singleByteInstruction(0x51);
export const MSTORE = singleByteInstruction(0x52);
export const MSTORE8 = singleByteInstruction(0x53);
export const ADD = singleByteInstruction(0x01);
export const SUB = singleByteInstruction(0x03);
export const RETURN = singleByteInstruction(0xf3);
export const STOP = singleByteInstruction(0x00);

export function VERBATIM(bytes: Bytes): Instruction {
    const byteSize = byteLength(bytes);
    return {
        byteSize: () => byteSize,
        generate: () => strip0x(bytes),
    };
}

export function PUSH(byteSize: number, bytes: Bytes): Instruction {
    assert(1 <= byteSize && byteSize <= 32);
    return {
        byteSize: () => byteSize + 1,
        generate: () => concat(byte(0x60 + byteSize - 1), bytes),
    };
}

export function PUSH_NUMBER(num: number): Instruction {
    if (num == 0) return PUSH0;
    const bytes = toHex(num);
    const byteSize = byteLength(bytes);
    console.log('PUSH_NUMBER', num, bytes, byteSize);
    const res = PUSH(byteSize, bytes);
    return res;
}

export const PUSH_ADDRESS = (address: Bytes) => PUSH(20, address);

export function LABEL(
    labelName: string,
    params?: {
        isEmpty?: boolean;
    }
): Instruction {
    const { isEmpty = false } = params ?? {};
    return {
        register: (context) => context.addLabel(labelName),
        byteSize: () => (isEmpty ? 0 : 1),
        generate: () => (isEmpty ? '' : byte(0x5b)),
    };
}

export function PUSH_LABEL(
    labelName: string,
    params?: {
        offset?: number;
    }
): Instruction {
    const { offset = 0 } = params ?? {};

    return {
        byteSize: (context) => 1 + context.getLabelSize(),
        generate: (context) => {
            const labelSize = context.getLabelSize();
            return concat(byte(0x60 + labelSize - 1), toHex(context.getPos(labelName) + offset, labelSize));
        },
    };
}

export function MLOAD_OFFSET(offset: number): Instruction {
    return joinInstructions(PUSH_NUMBER(offset), MLOAD);
}

export function MSTORE_OFFSET(offset: number): Instruction {
    return joinInstructions(PUSH_NUMBER(offset), MSTORE);
}

export function MSTORE8_OFFSET(offset: number): Instruction {
    return joinInstructions(PUSH_NUMBER(offset), MSTORE8);
}

export function DUP(which: number): Instruction {
    assert(1 <= which && which <= 16);
    return singleByteInstruction(0x80 + which - 1);
}

export function SWAP(which: number): Instruction {
    assert(1 <= which && which <= 16);
    return singleByteInstruction(0x90 + which - 1);
}
