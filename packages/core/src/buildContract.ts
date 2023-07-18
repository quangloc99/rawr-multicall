import { InstructionContext, PreprocessingInstructionContext } from './InstructionContext';
import { Bytes, concatBytes, bytesToHexWith0x } from './Bytes';
import { assert, assertDefined } from './errors';
import * as ins from './instructions';

export const DEFAULT_LABEL_SIZE = 3;

export type InstructionContextParams = {
    labelSize?: number;
    allowPUSH0?: boolean;
};

export function buildContract(
    instructions: ins.Instruction[],
    params?: InstructionContextParams
): {
    splittedByteCodes: Bytes[];
    byteCode: string;
} {
    const { labelSize = DEFAULT_LABEL_SIZE, allowPUSH0 = false } = params ?? {};
    const labelPosition = new Map<string, number>();
    let totalSize = 0;

    const preprocessingInstructionContext: PreprocessingInstructionContext = {
        getLabelSize: () => labelSize,
        allowPUSH0: () => allowPUSH0,
        addLabel(label: string) {
            assert(!labelPosition.has(label), `Duplicated label ${JSON.stringify(label)}`);
            labelPosition.set(label, totalSize);
        },
    };

    for (const instruction of instructions) {
        instruction.register?.(preprocessingInstructionContext);
        const insSize = instruction.byteSize(preprocessingInstructionContext);
        totalSize += insSize;
    }

    const instructionContext: InstructionContext = {
        ...preprocessingInstructionContext,

        instructions,
        getPos(label: string) {
            const res = labelPosition.get(label);
            return assertDefined(res, `Label ${JSON.stringify(label)} not found`);
        },
        getTotalSize: () => totalSize,
    };

    const splittedByteCodes: Bytes[] = [];
    for (const instruction of instructions) {
        splittedByteCodes.push(instruction.generate(instructionContext));
    }

    const byteCode = bytesToHexWith0x(concatBytes(splittedByteCodes));
    return {
        splittedByteCodes,
        byteCode,
    };
}
