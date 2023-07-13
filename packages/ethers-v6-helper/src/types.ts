export type MethodNames<C> = C extends {
    interface: {
        getFunction(name: infer Name extends string, ...params: unknown[]): unknown;
    };
}
    ? Name
    : string;

// TODO strip the overrides
export type MethodParameters<C, Name extends MethodNames<C>> = C extends {
    [key in Name]: {
        staticCall(...params: infer NamedParams): unknown;
    };
}
    ? NamedParams
    : unknown[];

export type MethodReturnType<C, Name extends MethodNames<C>> = C extends {
    [key in Name]: {
        staticCall(...params: unknown[]): infer ReturnType;
    };
}
    ? Awaited<ReturnType>
    : unknown;
