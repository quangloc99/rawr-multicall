import { Bytes, byteLength, concat, strip0x } from './bytes';

export type JoinedCalldata = {
    result: Bytes;
    parts: {
        offset: number;
        size: number;
        groupId: number;
    }[];
};

export type CalldataJoiner = {
    join(data: Bytes[]): JoinedCalldata;
};

export const basicCalldataJoiner = {
    join(data: Bytes[]) {
        const result = concat(data);
        const parts: JoinedCalldata['parts'] = [];
        let currentOffset = 0;
        for (const [id, d] of data.entries()) {
            const size = byteLength(d);
            parts.push({ offset: currentOffset, size, groupId: id });
            currentOffset += size;
        }
        return { result, parts };
    },
};

export const groupedCalldataJoiner: CalldataJoiner = {
    join(data: Bytes[]) {
        const dataGroup = new Map<Bytes, number[]>();
        for (let i = 0; i < data.length; ++i) {
            const d = strip0x(data[i]);
            let g = dataGroup.get(d);
            if (g == undefined) {
                dataGroup.set(d, (g = []));
            }
            g.push(i);
        }

        const compressedData: Bytes[] = [];
        const dummyPart = { offset: 0, size: 0, groupId: 0 };
        const parts = data.map(() => dummyPart);

        let currentOffset = 0;
        for (const [groupId, [d, group]] of Array.from(dataGroup.entries()).entries()) {
            compressedData.push(d);
            const size = byteLength(d);
            for (const i of group) {
                parts[i] = { offset: currentOffset, size, groupId };
            }
            currentOffset += size;
        }
        return { result: concat(compressedData), parts };
    },
};
