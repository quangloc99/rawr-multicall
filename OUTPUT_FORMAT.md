# Internal details

## The output format

Each output entry should have two properties:

- `boolean success`
- `bytes returnData`
  - Will be the call result when `success == true`.
  - Will be the error otherwise.

The corresponding definition for the contract should be the [following](https://github.com/mds1/multicall/blob/3ca8eb29453d06fb271c80fb2d6ae3a1b46174cb/src/Multicall3.sol#L32)

```solidity
struct Result {
    boolean success;
    bytes data;
}
```

### The ABI.encode format

The return value of the method will be `Result[] res`. In low-level,
`abi.encode` will be called. See
[abi-spec](https://docs.soliditylang.org/en/develop/abi-spec.html) for more
details.

In short, there will be lots of redundant fields, such as the length of `res`
(as we know how many calls we already have), and the offset. All of the cell are
aligned to 32 bytes, which is waste of space!

### Raw multicall output format

For each entry, there will be only 3 fields:

| Name          | Size (bits)       |
| :------------ | :---------------- |
| `success`     | 1                 |
| `data.length` | 31                |
| `data`        | `data.length * 8` |

And all of these will be packed, and will be put one after another. This way,
we won't waste lots of spaces, as we don't need flexibility of `abi.encode`.
