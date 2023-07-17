# no-side-effect-call

## Contract

The contract only contains a fallback that will call a method of another contract,
with the given address and call data. After that it will **revert** the success status
along side with the result.

### Input layout for fallback

| Fields    | Size (bytes) |
| :-------- | ------------ |
| Gas Limit | 4            |
| Address   | 20           |
| Call data | The rest     |

- Data is packed tightly together, and won't align to word size.
- If the call does not specify gas limit, the library will automatically set it to $2^{32} - 1$ before sending.
- `value` is not required, since we can just use `msg.value` (i.e `CALLVALUE` instruction).
- `call data` size is not required either, as we can use `CALLDATASIZE` instruction.

### Output layout for fallback

Or rather the laytout of the `revert`.

| Fields  | Size (bytes) |
| :------ | ------------ |
| Success | 1            |
| Data    | The rest     |

This will be the easiest way to compress the data. The result will be decoded on
the client side rather than in the contract.
