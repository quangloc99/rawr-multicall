import { InstructionContext, PreprocessingInstructionContext } from './InstructionContext';
import { Bytes, concat, add0x } from './bytes';
import { assert, assertDefined } from './errors';
import * as ins from './instructions';

export const DEFAULT_LABEL_SIZE = 3;

export type InstructionContextParams = {
    labelSize?: number;
};

export function buildContract(instructions: ins.Instruction[], params?: InstructionContextParams): Bytes {
    const { labelSize = DEFAULT_LABEL_SIZE } = params ?? {};
    const labelPosition = new Map<string, number>();
    let totalSize = 0;

    const preprocessingInstructionContext: PreprocessingInstructionContext = {
        getLabelSize: () => labelSize,
        addLabel(label: string) {
            assert(!labelPosition.has(label), `Duplicated label ${JSON.stringify(label)}`);
            labelPosition.set(label, totalSize);
            console.log('added label', label, totalSize);
        },
    };

    for (const instruction of instructions) {
        instruction.register?.(preprocessingInstructionContext);
        const insSize = instruction.byteSize(preprocessingInstructionContext);
        totalSize += insSize;
    }
    console.log({ totalSize });

    const instructionContext: InstructionContext = {
        ...preprocessingInstructionContext,

        instructions,
        getPos(label: string) {
            const res = labelPosition.get(label);
            assertDefined(res, `Label ${JSON.stringify(label)} not found`);
            return res;
        },
        getTotalSize: () => totalSize,
    };

    const res: Bytes[] = [];
    for (const instruction of instructions) {
        res.push(instruction.generate(instructionContext));
    }

    console.log(res);

    return add0x(concat(res));
}
