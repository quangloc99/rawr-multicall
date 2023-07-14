export type MethodNames<C> = C extends {
    interface: {
        getFunction(name: infer Name extends string, ...params: unknown[]): unknown;
    };
}
    ? Name
    : string;

export type MethodParameters<C, Name extends MethodNames<C>> = C extends {
    callStatic: {
        [key in Name]: (...params: [...infer NamedParams, object?]) => unknown;
    };
}
    ? NamedParams
    : unknown[];

export type MethodReturnType<C, Name extends MethodNames<C>> = C extends {
    callStatic: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key in Name]: (...params: [...any, object?]) => Promise<infer Ret>;
    };
}
    ? Ret
    : unknown;
