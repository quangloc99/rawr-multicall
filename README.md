# Rawr-multicall

Powerful, type-safe alternative to [Multicall][Multicall3] for off-chain smart contract query

## What?

This is a library that help you to perform off-chain query to smart contracts by
batching multiple calls together into one call. But unlike the [_well done_
muitlcall3][Multicall3] that try to do everything in a smart contract, this
library will **generate** new smart contracts bytecode for you each time
you call the library.

Benefit from the **raw** power of the bytecode generation, [Rawr-multicall]
provides more powerful features than the on-chain counter part

- ✅ gas efficient,
  - No ABI encode/decode.
  - No looping through calls.
  - Values (address, gas limit, call value) are inlined.
- ✅ small payload, for both request and response.
  - Input calldata compression where possible.
  - Custom output format.
- ✅ ability to set custom gas and value limit for **individual** call.
- ✅ custom call logic with custom contract deployment before calls.

With builtin plugins come more features:

- ✅ type-safe wrapper for [Ether.js] (v5 and v6) that generated with [Typechain],
  - Easy to extend for the other libraries too!
- ✅ Make call and get the result **without side effect** (revert after call).

## Installation

> TODO

## Usage

### Using pure [Rawr-multicall]

To use pure [Rawr-multicall], you need **external** too to generate your call data,
as well as to decode the result.

In this example, [Ethers.js] v5/v6 is used.

```ts
import {
  createCall,
  buildRawrMulticallContract,
  decodeResult,
  unwrap,
} from "@rawr-multicall/core";
import { Interface, JsonRpcProvider } from "ethers"; // ethers v6
import { abi as ERC20Abi } from "@rawr-multicall/test-helper/artifacts/test-contracts/ERC20.sol/ERC20.json";

const ERC20Iface = new Interface(ERC20Abi);
const provider = new JsonRpcProvider("https://eth.llamarpc.com");
const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const userAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";

async function main() {
  // Step 1. Create calls
  const calls = [
    createCall(usdcAddress, ERC20Iface.encodeFunctionData("name")),
    createCall(usdcAddress, ERC20Iface.encodeFunctionData("symbol")),
    createCall(usdcAddress, ERC20Iface.encodeFunctionData("decimals")),
    createCall(usdcAddress, ERC20Iface.encodeFunctionData("totalSupply")),
    createCall(
      usdcAddress,
      ERC20Iface.encodeFunctionData("balanceOf", [userAddress]),
    ),
  ];

  // Step 2. Build contract
  const contract = buildRawrMulticallContract(calls);

  // Step 3. Simulate
  const rawResult = await provider.call({ data: contract.byteCode });

  // Step 4. Decode result
  const results = decodeResult(calls, rawResult);

  // Step 5. Extract individual result
  console.log(
    "name",
    ERC20Iface.decodeFunctionResult("name", unwrap(results[0])),
  );
  console.log(
    "symbol",
    ERC20Iface.decodeFunctionResult("symbol", unwrap(results[1])),
  );
  console.log(
    "decimals",
    ERC20Iface.decodeFunctionResult("decimals", unwrap(results[2])),
  );
  console.log(
    "totalSupply",
    ERC20Iface.decodeFunctionResult("totalSupply", unwrap(results[3])),
  );
  console.log(
    "balanceOf",
    ERC20Iface.decodeFunctionResult("balanceOf", unwrap(results[4])),
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

#### Step 1. Create calls

To create a single call, `createCalls(address, calldata)` is used.

In the above example, [Ethers.js] v6's Interface is used to generate the byte code.

#### Step 2. Build contract

```ts
const contract = buildRawrMulticallContract(calls);
```

That is, just use `buildRawrMulticallContract` to generate the contract.

#### Step 3. Simulate

```ts
const rawResult = await provider.call({ data: contract.byteCode });
```

Here `provider.call` is used, which is essentially make an `eth_call` to
the provider.

Note that there is **no** receiver address (the `to` property), meaning this is
a contract deployment simulation call! We can receive the result because the
contract initialization code contains the `RETURN` instruction, and
[Rawr-multicall] makes use of that!

#### Step 4. Decode result

```ts
const results = decodeResult(calls, rawResult);
```

The constant `results` will be an array of the following type:

```ts
type Result =
  | { success: true; result: Uint8Array }
  | { success: false; error: Uint8Array };
```

So in case of failed call, the error data is also returned.

#### Step 5. Extract individual result

To get the meaningful result, again [Ethers.js] v6's Interface is used
again to decode the result.

[Rawr-multicall] provides a function `unwrap` which is similar to `Result::unwrap`
function of Rust: it will return the result bytes in the successful case,
and will **throw** the error bytes otherwise.

### Using [Rawr-multicall] with `ethers-v5-helpers` and `ethers-v6-helpers`

If you think the above way to use [Rawr-multicall] is a bit _raw_
and tedious, `@rawr-multicall/ethers-v5-helper` and `ethers-v6-helper` will
provide you a **type-safe**, **easy-to-use** wrapper for `createCall`.

#### Using `ethers-v5-helper`

```ts
import {
  buildRawrMulticallContract,
  decodeResult,
  unwrap,
} from "@rawr-multicall/core";
import { createEthersV5Call } from "@rawr-multicall/ethers-v5-helper";
import { abi as ERC20Abi } from "@rawr-multicall/test-helper/artifacts/test-contracts/ERC20.sol/ERC20.json";
import { ERC20 } from "@rawr-multicall/ethers-v5-helper/ethers-v5-contracts/typechain-types/ERC20";
import { ethers, providers } from "ethers-v5"; // package alias

const provider = new providers.JsonRpcProvider("https://eth.llamarpc.com");
const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const userAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const usdcContract = new ethers.Contract(usdcAddress, ERC20Abi) as ERC20;

async function main() {
  // Step 1. Create calls
  const calls = [
    createEthersV5Call(usdcContract, "name", []),
    createEthersV5Call(usdcContract, "symbol", []),
    createEthersV5Call(usdcContract, "decimals", []),
    createEthersV5Call(usdcContract, "totalSupply", []),
    createEthersV5Call(usdcContract, "balanceOf", [userAddress]),
  ] as const; // add this for type-safe

  // Step 2. Build contract
  const contract = buildRawrMulticallContract(calls);

  // Step 3. Simulate
  const rawResult = await provider.call({ data: contract.byteCode });

  // Step 4. Decode result
  const results = decodeResult(calls, rawResult);

  // Step 5. Print result
  // No extraction required!
  console.log("name", unwrap(results[0]));
  console.log("symbol", unwrap(results[1]));
  console.log("decimals", unwrap(results[2]));
  console.log("totalSupply", unwrap(results[3]).toString());
  console.log("balanceOf", unwrap(results[4]).toString());
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

This example is very similar to the _pure_ example, except, everything will be decoded for you!

The parameters `methodName` and `methodParams` of `createEthersV5Call(contract, methodName, methodParams, params?)`
will be **typed**, meaning if you pass in the **typed** `contract` (that generated via [Typechain]),
then your `methodName` will only be the name of `contract`'s method. Then `methodParams` will tie to `methodName`.

The result is also **typed**. Thanks to `as const` in the `calls` creation:

- `unwrap(results[0])` and `unwrap(results[1])` will be `string`,
- `unwrap(results[2])` will be `number` (as the contract type is `uint8`),
- `unwrap(result[3])` and `unwrap(results[4])` will be `BigNumber`.

#### Using `ethers-v6-helper`

```ts
import {
  buildRawrMulticallContract,
  decodeResult,
  unwrap,
} from "@rawr-multicall/core";
import { createEthersV6Call } from "@rawr-multicall/ethers-v6-helper";
import { abi as ERC20Abi } from "@rawr-multicall/test-helper/artifacts/test-contracts/ERC20.sol/ERC20.json";
import { ethers } from "ethers";
import { ERC20 } from "@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types/ERC20";

const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const userAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const usdcContract = new ethers.Contract(
  usdcAddress,
  ERC20Abi,
) as unknown as ERC20;

async function main() {
  // Step 1. Create calls
  const calls = [
    await createEthersV6Call(usdcContract, "name", []),
    await createEthersV6Call(usdcContract, "symbol", []),
    await createEthersV6Call(usdcContract, "decimals", []),
    await createEthersV6Call(usdcContract, "totalSupply", []),
    await createEthersV6Call(usdcContract, "balanceOf", [userAddress]),
  ] as const; // add this for type-safe

  // Step 2. Build contract
  const contract = buildRawrMulticallContract(calls);

  // Step 3. Simulate
  const rawResult = await provider.call({ data: contract.byteCode });

  // Step 4. Decode result
  const results = decodeResult(calls, rawResult);

  // Step 5. Print result
  // No extraction required!
  console.log("name", unwrap(results[0]));
  console.log("symbol", unwrap(results[1]));
  console.log("decimals", unwrap(results[2]));
  console.log("totalSupply", unwrap(results[3]));
  console.log("balanceOf", unwrap(results[4]));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

This is almost the same as `ethers-v5-helpers`. Everything will be typed as you expected.

The only different here is `createEthersV6Call` is async. The reason is that [Ethers.js] v6
does not have a way to get the contract address in a `sync` way. So we need to `await`
for `createEthersV6Call`.

### Setting custom `value` and `gasLimit`

All three functions `createCall`, `createEthersV5Call` and `createEthersV6Call` accept an
optional params, allowing you to set custom parameters.

```ts
createCall(<address>, <calldata>, {
  gasLimit: /* Custom gas limit. Optional */,
  value: /* Custom value. Optional */,
});
createEthersV5Call(<contract>, <methodName>, <methodParams>, {
  gasLimit: /* Custom gas limit. Optional */,
  value: /* Custom value. Optional */,
});
createEthersV6Call(<contract>, <methodName, <methodParams>, {
  gasLimit: /* Custom gas limit. Optional */,
  value: /* Custom value. Optional */,
});
```

### Custom logic with _predeploy_ contract

Suppose that you have this [Counter contract][Counter-contract]. You don't want
to _actually_ deploy it, but still want to interact with it somehow. [Rawr-multicall]
got your cover!

```ts
import {
  buildRawrMulticallContract,
  decodeResult,
  unwrap,
  labeledAddress,
} from "@rawr-multicall/core";
import { createEthersV6Call } from "@rawr-multicall/ethers-v6-helper";
import { abi as CounterABI } from "@rawr-multicall/test-helper/artifacts/test-contracts/Counter.sol/Counter.json";
import { ethers } from "ethers";
import {
  Counter,
  Counter__factory,
} from "@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types";

const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
const usdcContract = new ethers.Contract(
  ethers.ZeroAddress,
  CounterABI,
) as unknown as Counter;

async function main() {
  // Step 1. Create calls
  const calls = [
    await createEthersV6Call(usdcContract, "counter", [], {
      withAddress: labeledAddress("test-counter"),
    }),
    await createEthersV6Call(usdcContract, "inc", [], {
      withAddress: labeledAddress("test-counter"),
    }),
    await createEthersV6Call(usdcContract, "inc", [], {
      withAddress: labeledAddress("test-counter"),
    }),
    await createEthersV6Call(usdcContract, "counter", [], {
      withAddress: labeledAddress("test-counter"),
    }),
  ] as const; // add this for type-safe

  // Step 2. Build contract
  const contract = buildRawrMulticallContract(calls, {
    predeployContracts: {
      "test-counter": (await new Counter__factory().getDeployTransaction())
        .data,
    },
  });

  // Step 3. Simulate
  const rawResult = await provider.call({ data: contract.byteCode });

  // Step 4. Decode result
  const results = decodeResult(calls, rawResult);

  // Step 5. Print result
  // No extraction required!
  console.log(unwrap(results[0]));
  console.log(unwrap(results[1]));
  console.log(unwrap(results[2]));
  console.log(unwrap(results[3]));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

Here we name our contract `test-counter`. [Rawr-multicall] when received the byte code
of `test-counter` passed in `buildRawrMulticallContract`, the generated byte code will
deploy the contract first. The calls can then access this contract with `labeledAddress`.

For `createCall`, you can pass `labeledAddress` as the **first** parameters.

For `createEthersV5Call` and `createEthersV6Call`, you pass this in the optional parameters
as above.

Under the hood, [Rawr-multicall] uses `CREATE2` for deterministic addresses.

#### Register predeploy contract

[Rawr-multicall] also provides a way to register predeploy contract _globally_.

```ts
import { registerPredeployContract } from '@rawr-multicall/core';

registerPredeployContract(label: string, initCode: string | Uint8Array);
```

### Call without side effect

Sometimes you just want to get the function result, but you don't want that function
to modify the storage. `@rawr-multicall/no-side-effect-call` will help you!

```ts
import {
  buildRawrMulticallContract,
  decodeResult,
  unwrap,
  labeledAddress,
} from "@rawr-multicall/core";
import { createEthersV6Call } from "@rawr-multicall/ethers-v6-helper";
import { abi as CounterABI } from "@rawr-multicall/test-helper/artifacts/test-contracts/Counter.sol/Counter.json";
import { ethers } from "ethers";
import {
  Counter,
  Counter__factory,
} from "@rawr-multicall/test-helper/ethers-v6-contracts/typechain-types";
import { wrapNoSideEffectCall } from "@rawr-multicall/no-side-effect-call";

const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
const usdcContract = new ethers.Contract(
  ethers.ZeroAddress,
  CounterABI,
) as unknown as Counter;

async function main() {
  // Step 1. Create calls
  const calls = [
    await createEthersV6Call(usdcContract, "counter", [], {
      withAddress: labeledAddress("test-counter"),
    }),
    await createEthersV6Call(usdcContract, "inc", [], {
      withAddress: labeledAddress("test-counter"),
    }),
    wrapNoSideEffectCall(
      await createEthersV6Call(usdcContract, "inc", [], {
        withAddress: labeledAddress("test-counter"),
      }),
    ),
    await createEthersV6Call(usdcContract, "counter", [], {
      withAddress: labeledAddress("test-counter"),
    }),
  ] as const; // add this for type-safe

  // Step 2. Build contract
  const contract = buildRawrMulticallContract(calls, {
    predeployContracts: {
      "test-counter": (await new Counter__factory().getDeployTransaction())
        .data,
    },
  });

  // Step 3. Simulate
  const rawResult = await provider.call({ data: contract.byteCode });

  // Step 4. Decode result
  const results = decodeResult(calls, rawResult);

  // Step 5. Print result
  // No extraction required!
  console.log(unwrap(results[0]));
  console.log(unwrap(results[1]));
  console.log(unwrap(results[2]));
  console.log(unwrap(results[3]));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

With `wrapNoSideEffectCall`, the second `inc` effect was nullified, but the
result is still calculated and return to us. So the output will be `0 1 2 1` in
order.

Also `wrapNoSideEffectCall` is type-safe, meaning its result and error will have
the same type as the inner call.

Under the hood, `wrapNoSideEffectCall` also relied on a predeploy contract, but
[the contract][CallThenRevertContract] was written in Yul, with custom output
format. The make sure that the byte code, as well as the output is small.

### Error handling

For `createCall`, the error will be `bytes`. You need to decode the error yourself.

For `createEthersV5Call`, the error sighash is looked up in the contract. If the
corresponding error fragment is found, the error will contain that fragment.
Please refer to
[ethers-v5-helper/src/errors.ts](./packages/ethers-v5-helper/src/error.ts) to
see the list of errors.

The same is for `createEthersV6`, but we won't need to decode `Error(message)`
and `Panic(code)` individually, since [Ethers.js] will do that for us.  Please
refer to
[ethers-v6-helper/src/errors.ts](./packages//ethers-v6-helper/src/error.ts).

`wrapNoSideEffectCall` will have the same error type as the `inner` call.

### Other options

`buildRawrMulticallContract` also accept an optional parameters.

```ts
buildRawrMulticallContract(calls, params: {
  /**
   * Dictionary of predeploy contracts init code
   */
  predeployContract?: Record<string, Bytes | string>;

  /**
   * Turn it on to enable the usage of `PUSH0` instruction.
   * 
   * Default to false, as not all chain support this instruction yet.
   */
  allowPUSH0?: boolean;

  /**
   * Set the sender from and nonce to calculate the
   * rawr-multicall contract address (to calculate the other CREATE2 contract)
   */
  sender?: {
    from?: RawAddressString;  // default to 0x000...0
    nonce?: number; // default to 0
  };

  /**
   * A prefix to add before the predeploy contract label.
   * The salt will be calculated as `keccak25(create2SaltPrefix + contractLabel).
   * 
   * Default to `rawr-multicall:`
   */
  create2SaltPrefix?: string;
});
```

[Counter-contract]: ./packages/test-helper/test-contracts/Counter.sol
[Rawr-multicall]: https://github.com/quangloc99/rawr-multicall
[Multicall3]: https://github.com/mds1/multicall
[Typechain]: https://github.com/dethcrypto/TypeChain
[Ethers.js]: https://github.com/ethers-io/ethers.js/
[CallThenRevertContract]: ./packages/no-side-effect-call/contracts/CallThenRevert.yul
