import { type InstructionContext } from './InstructionContext';
import { Bytes, concat, byte } from './bytes';
import { assert } from './errors';
import { toHex } from './util';

const LABEL_LENGTH_bytes = 32;

export interface Instruction {
    byteSize(context: InstructionContext): number;
    generate(context: InstructionContext): Bytes;
    register?: (context: InstructionContext) => void;
}

export function singleByteInstruction(code: number): Instruction {
    return {
        byteSize: () => 1,
        generate: () => byte(code),
    };
}

// https://www.evm.codes/

export const PUSH0 = singleByteInstruction(0x60);
export const GAS = singleByteInstruction(0x5a);
export const CODECOPY = singleByteInstruction(0x39);
export const RETURNDATASIZE = singleByteInstruction(0x3d);
export const RETURNDATACOPY = singleByteInstruction(0x3e);

export const PUSH = (byteSize: number, bytes: Bytes): Instruction => {
    assert(1 <= byteSize && byteSize <= 32);
    return {
        byteSize: () => byteSize + 1,
        generate: () => concat(byte(0x60 + byteSize), bytes),
    };
};

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

export const PUSH_LABEL = (
    labelName: string,
    params?: {
        offset?: number;
    }
): Instruction => {
    const { offset = 0 } = params ?? {};

    return {
        byteSize: (context) => 1 + context.getLabelSize(),
        generate: (context) => {
            const labelSize = context.getLabelSize();
            return concat(byte(0x60 + labelSize), toHex(context.getPos(labelName) + offset, labelSize));
        },
    };
};
