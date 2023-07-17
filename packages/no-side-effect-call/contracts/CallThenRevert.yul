object "CallThenRevert" {
    // This is the constructor code of the contract.
    code {
        // Deploy the contract
        datacopy(0, dataoffset("runtime"), datasize("runtime"))
        return(0, datasize("runtime"))
    }

    object "runtime" {
        code {
            calldatacopy(0x80, 0, calldatasize())
            let gasAndAddress := mload(0x80)
            let success := call(
                shr(gasAndAddress, 160 /* = 20 * 8 */), // gas limit
                shr(shl(gasAndAddress, 96 /* = (32 - 20) * 8 */), 96),  // contract addresses
                callvalue(),
                0xa0, // calldata offset = 0x80 + 32
                sub(calldatasize(), 32), // calldata size
                0, // dest offset
                0 // dest size
            )
            mstore(success, 0x80)
            returndatacopy(
                0xa0, /* = 0x80 + 32 */
                0,
                returndatasize()
            )
            revert(
                0x9f, /* = 0x80 + 32 - 1 */
                add(returndatasize(), 1)
            )
        }
    }
  }