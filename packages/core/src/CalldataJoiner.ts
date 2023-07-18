import { Bytes, concatBytes, bytesToHex } from './Bytes';

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
        const result = concatBytes(data);
        const parts: JoinedCalldata['parts'] = [];
        let currentOffset = 0;
        for (const [id, d] of data.entries()) {
            const size = d.length;
            parts.push({ offset: currentOffset, size, groupId: id });
            currentOffset += size;
        }
        return { result, parts };
    },
};

export const groupedCalldataJoiner: CalldataJoiner = {
    join(data: Bytes[]) {
        const dataGroup = new Map<string, { group: number[]; bytes: Bytes }>();
        for (let i = 0; i < data.length; ++i) {
            const d = data[i];
            const hex = bytesToHex(d);
            let g = dataGroup.get(hex);
            if (g == undefined) {
                dataGroup.set(hex, (g = { group: [], bytes: d }));
            }
            g.group.push(i);
        }

        const compressedData: Bytes[] = [];
        const dummyPart = { offset: 0, size: 0, groupId: 0 };
        const parts = data.map(() => dummyPart);

        let currentOffset = 0;
        for (const [groupId, [, { group, bytes: d }]] of Array.from(dataGroup.entries()).entries()) {
            compressedData.push(d);
            const size = d.length;
            for (const i of group) {
                parts[i] = { offset: currentOffset, size, groupId };
            }
            currentOffset += size;
        }
        return { result: concatBytes(compressedData), parts };
    },
};
