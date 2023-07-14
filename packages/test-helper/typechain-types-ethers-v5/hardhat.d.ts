/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "APlusB",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.APlusB__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "TestContract",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TestContract__factory>;
    getContractFactory(
      name: "ThrowError",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ThrowError__factory>;

    getContractAt(
      name: "APlusB",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.APlusB>;
    getContractAt(
      name: "ERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "TestContract",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TestContract>;
    getContractAt(
      name: "ThrowError",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ThrowError>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
