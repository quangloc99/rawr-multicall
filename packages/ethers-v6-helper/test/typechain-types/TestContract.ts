/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "./common";

export declare namespace TestContract {
  export type Vec2Struct = { x: BigNumberish; y: BigNumberish };

  export type Vec2StructOutput = [x: bigint, y: bigint] & {
    x: bigint;
    y: bigint;
  };
}

export interface TestContractInterface extends Interface {
  getFunction(
    nameOrSignature: "compare" | "hash" | "name" | "swapXY"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "compare",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "hash", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "swapXY",
    values: [TestContract.Vec2Struct]
  ): string;

  decodeFunctionResult(functionFragment: "compare", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hash", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "swapXY", data: BytesLike): Result;
}

export interface TestContract extends BaseContract {
  connect(runner?: ContractRunner | null): TestContract;
  waitForDeployment(): Promise<this>;

  interface: TestContractInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  compare: TypedContractMethod<
    [a: BigNumberish, b: BigNumberish],
    [bigint],
    "view"
  >;

  hash: TypedContractMethod<[a: BigNumberish], [bigint], "view">;

  name: TypedContractMethod<[], [string], "view">;

  swapXY: TypedContractMethod<
    [v: TestContract.Vec2Struct],
    [TestContract.Vec2StructOutput],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "compare"
  ): TypedContractMethod<[a: BigNumberish, b: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "hash"
  ): TypedContractMethod<[a: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "name"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "swapXY"
  ): TypedContractMethod<
    [v: TestContract.Vec2Struct],
    [TestContract.Vec2StructOutput],
    "view"
  >;

  filters: {};
}
