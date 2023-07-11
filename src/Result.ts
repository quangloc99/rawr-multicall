import { Bytes } from './bytes';
import { Call } from './Call';

export type RawResult = {
    success: boolean;
    data: Bytes;
};

export type Result<ResultType, ErrorType> =
    | {
          success: true;
          result: ResultType;
      }
    | {
          success: false;
          error: ErrorType;
      };

export type ResultOfCall<C extends Call<unknown, unknown>> = C extends Call<infer ReturnType, infer ErrorType>
    ? Result<ReturnType, ErrorType>
    : never;

export type ResultsOfCalls<Calls extends readonly Call<unknown, unknown>[]> = Calls['length'] extends 0
    ? []
    : number extends Calls['length']
    ? ResultOfCall<Calls[number]>[]
    : Calls extends readonly [
          infer Head extends Call<unknown, unknown>,
          ...infer Rest extends readonly Call<unknown, unknown>[]
      ]
    ? [ResultOfCall<Head>, ...ResultsOfCalls<Rest>]
    : never;
