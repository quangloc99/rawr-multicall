# no-side-effect-call

## Contract

The contract only contains a fallback that will call a method of another contract,
with the given address and call data. After that it will **revert** the success status
along side with the result.

### Input layout for fallback

| Fields    | Size (bytes) |
| :-------- | ------------ |
| Padding   | 8            |
| Gas Limit | 4            |
| Address   | 20           |
| Call data | The rest     |

- Padding is zero-filled. It is there to pack gas limit and address in one word.
- `value` is not required, since we can just use `msg.value` (i.e `CALLVALUE` instruction).
- `call data` size is not required either, as wel can use `CALLDATASIZE` instruction.

### Output layout for fallback

Or rather the laytout of the `revert`.

| Fields  | Size (bytes) |
| :------ | ------------ |
| Success | 1            |
| Data    | The rest     |

This will be the easiest way to compress the data. The result will be decoded on
the client side rather than in the contract.
