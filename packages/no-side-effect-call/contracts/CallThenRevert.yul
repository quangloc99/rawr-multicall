object "CallThenRevert" {
    // This is the constructor code of the contract.
    code {
        // Deploy the contract
        datacopy(0, dataoffset("runtime"), datasize("runtime"))
        return(0, datasize("runtime"))
    }

    object "runtime" {
        code {
            calldatacopy(0, 0, calldatasize())
            let gasAndAddressWord := mload(0)
            let gasLimit := shr(
                gasAndAddressWord,
                224 /* = (32 - 4) * 8 */
            )
            let contractAddress := shl(
                shr(
                    gasAndAddressWord,
                    32 /* = 4 * 8 */
                ),
                96 /* = (32 - 20) * 8 */
            )
            let success := call(
                gasLimit,
                contractAddress,
                callvalue(),
                24, // calldata offset = 4 + 20
                sub(calldatasize(), 24), // calldata size
                0, // dest offset
                0 // dest size
            )
            mstore(success, 0)
            returndatacopy(
                32,
                0,
                returndatasize()
            )
            // put the success byte to the front
            revert(
                31,
                add(returndatasize(), 1)
            )
        }
    }
  }