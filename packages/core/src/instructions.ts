import { InstructionContext, PreprocessingInstructionContext } from './InstructionContext';
import { Bytes, byte, concatBytes, hexToBytes, numberToBytes, toBytes, EMPTY_BYTES } from './Bytes';
import { assert } from './errors';

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
        generate: (context) => concatBytes(instructions.map((ins) => ins.generate(context))),
    };
}

// https://www.evm.codes/

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
export const SHL = singleByteInstruction(0x1b);
export const CREATE = singleByteInstruction(0xf0);
export const CREATE2 = singleByteInstruction(0xf5);
export const POP = singleByteInstruction(0x50);

export function VERBATIM(bytes: Bytes): Instruction {
    return {
        byteSize: () => bytes.length,
        generate: () => bytes,
    };
}

export function PUSH(bytes: Bytes, byteSize: number = bytes.length): Instruction {
    assert(1 <= byteSize && byteSize <= 32);
    return {
        byteSize: () => byteSize + 1,
        generate: () => concatBytes([byte(0x60 + byteSize - 1), bytes]),
    };
}

export const PUSH0: Instruction = {
    byteSize: (context) => (context.allowPUSH0() ? 1 : 2),
    generate: (context) => (context.allowPUSH0() ? byte(0x5f) : hexToBytes('6000')),
};

export function PUSH_NUMBER(num: number): Instruction {
    if (num == 0) return PUSH0;
    const bytes = numberToBytes(num);
    const res = PUSH(bytes);
    return res;
}

export const PUSH_ADDRESS = (address: Bytes | string) => {
    address = toBytes(address);
    assert(address.length == 20, 'Address must be a byte sequence of length 20');
    return PUSH(address);
};

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
        generate: () => (isEmpty ? EMPTY_BYTES : byte(0x5b)),
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
            return PUSH(numberToBytes(context.getPos(labelName) + offset, labelSize)).generate(context);
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
