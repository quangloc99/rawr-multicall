import { Bytes } from './Bytes';
import { Call } from './Call';
import { RawMulticallError } from './errors';

export type RawResult = {
    success: boolean;
    data: Bytes;
};

export type Result<ResultType, ErrorType> =
    | { success: true; result: ResultType }
    | { success: false; error: ErrorType };

export function unwrap<ReturnType>(r: Result<ReturnType, unknown>): ReturnType {
    if (r.success) return r.result;
    throw r.error;
}

export function getResultError<ErrorType>(r: Result<unknown, ErrorType>): ErrorType {
    if (!r.success) return r.error;
    throw new RawMulticallError('can not get the error of successful result');
}

export type ResultOfCall<C extends Call<unknown, unknown>> = C extends Call<infer ReturnType, infer ErrorType>
    ? Result<ReturnType, ErrorType>
    : never;

export type ResultsOfCalls<Calls extends readonly Call<unknown, unknown>[]> = Calls['length'] extends 0
    ? []
    : number extends Calls['length']
    ? ResultOfCall<Calls[number]>[]
    : Calls extends readonly [
          infer Head extends Call<unknown, unknown>,
          ...infer Rest extends readonly Call<unknown, unknown>[],
      ]
    ? [ResultOfCall<Head>, ...ResultsOfCalls<Rest>]
    : never;
