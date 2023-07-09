import { Bytes } from './bytes';

export type Call = {
    contractAddress: Bytes;
    data: Bytes;
};

function createCall(contractAddress: Bytes, data: Bytes): Call {
    return { contractAddress, data };
}
