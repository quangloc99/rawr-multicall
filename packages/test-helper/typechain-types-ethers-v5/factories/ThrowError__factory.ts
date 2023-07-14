/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ThrowError, ThrowErrorInterface } from "../ThrowError";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "number",
        type: "uint256",
      },
    ],
    name: "CustomError",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string",
      },
    ],
    name: "justRevert",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
    ],
    name: "revertCustom",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string",
      },
    ],
    name: "revertError",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "revertPanic",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50610539806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c8063082515fd146100515780633e431b121461006f5780637e608c9d1461008b578063d4e6a2b0146100a7575b600080fd5b6100596100c3565b604051610066919061017d565b60405180910390f35b610089600480360381019061008491906102f2565b6100df565b005b6100a560048036038101906100a0919061039b565b6100e8565b005b6100c160048036038101906100bc9190610414565b610127565b005b60008060019050600080826100d89190610470565b9250505090565b80518060208301fd5b81816040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011e9291906104df565b60405180910390fd5b806040517f110b365500000000000000000000000000000000000000000000000000000000815260040161015b919061017d565b60405180910390fd5b6000819050919050565b61017781610164565b82525050565b6000602082019050610192600083018461016e565b92915050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101ff826101b6565b810181811067ffffffffffffffff8211171561021e5761021d6101c7565b5b80604052505050565b6000610231610198565b905061023d82826101f6565b919050565b600067ffffffffffffffff82111561025d5761025c6101c7565b5b610266826101b6565b9050602081019050919050565b82818337600083830152505050565b600061029561029084610242565b610227565b9050828152602081018484840111156102b1576102b06101b1565b5b6102bc848285610273565b509392505050565b600082601f8301126102d9576102d86101ac565b5b81356102e9848260208601610282565b91505092915050565b600060208284031215610308576103076101a2565b5b600082013567ffffffffffffffff811115610326576103256101a7565b5b610332848285016102c4565b91505092915050565b600080fd5b600080fd5b60008083601f84011261035b5761035a6101ac565b5b8235905067ffffffffffffffff8111156103785761037761033b565b5b60208301915083600182028301111561039457610393610340565b5b9250929050565b600080602083850312156103b2576103b16101a2565b5b600083013567ffffffffffffffff8111156103d0576103cf6101a7565b5b6103dc85828601610345565b92509250509250929050565b6103f181610164565b81146103fc57600080fd5b50565b60008135905061040e816103e8565b92915050565b60006020828403121561042a576104296101a2565b5b6000610438848285016103ff565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b600061047b82610164565b915061048683610164565b92508261049657610495610441565b5b828204905092915050565b600082825260208201905092915050565b60006104be83856104a1565b93506104cb838584610273565b6104d4836101b6565b840190509392505050565b600060208201905081810360008301526104fa8184866104b2565b9050939250505056fea2646970667358221220f95d61a2496eb61076883efe8f4ee8fb4bdcf30517ca2d83028e57e726da18a564736f6c63430008110033";

type ThrowErrorConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ThrowErrorConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ThrowError__factory extends ContractFactory {
  constructor(...args: ThrowErrorConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: string }
  ): Promise<ThrowError> {
    return super.deploy(overrides || {}) as Promise<ThrowError>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: string }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): ThrowError {
    return super.attach(address) as ThrowError;
  }
  override connect(signer: Signer): ThrowError__factory {
    return super.connect(signer) as ThrowError__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ThrowErrorInterface {
    return new utils.Interface(_abi) as ThrowErrorInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ThrowError {
    return new Contract(address, _abi, signerOrProvider) as ThrowError;
  }
}