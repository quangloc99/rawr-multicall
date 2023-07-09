import { type Instruction } from './instructions';

export type PreprocessingInstructionContext = {
    getLabelSize(): number;
    addLabel(label: string): void;
};

export type InstructionContext = PreprocessingInstructionContext & {
    instructions: Instruction[];
    getTotalSize(): number;

    getPos(label: string): number;
    // might be useful in the future
    // getPos(instruction: Instruction): number;
};
