object "CallThenRevert" {
    // This is the constructor code of the contract.
    code {
        // Deploy the contract
        datacopy(0, dataoffset("runtime"), datasize("runtime"))
        return(0, datasize("runtime"))
    }

    object "runtime" {
        code {
            function gasLimitSize() -> r { r := 4 }
            function contractAddressSize() -> r { r := 20 }

            calldatacopy(0, 0, calldatasize())
            let gasAndAddressWord := mload(0)

            let gasLimit := shr(
                gasAndAddressWord,
                mul(sub(32, gasLimitSize()), 8)
            )
            let contractAddress := shl(
                shr(
                    gasAndAddressWord,
                    mul(gasLimitSize(), 8)
                ),
                mul(sub(32, contractAddressSize()), 8)
            )
            let success := call(
                gasLimit,
                contractAddress,
                callvalue(),
                add(gasLimitSize(), contractAddressSize()), // calldata offset
                sub(calldatasize(), add(gasLimitSize(), contractAddressSize())), // calldata size
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
                sub(32, 1),
                add(returndatasize(), 1)
            )

        }
    }
}