import { type Instruction } from './Instruction';

export type InstructionContext = {
    instructions: Instruction[];
    getTotalSize(): number;
    getPos(instruction: Instruction): number;
    getPos(label: string): number;
    addLabel(label: string): number;
    getLabelSize(): number;
};
