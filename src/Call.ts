import { Bytes } from './bytes';

export type Call = {
    contractAddress: Bytes;
    data: Bytes;
};

export function createCall(contractAddress: Bytes, data: Bytes): Call {
    return { contractAddress, data };
}
