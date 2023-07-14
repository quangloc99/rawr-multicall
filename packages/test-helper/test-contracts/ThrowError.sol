pragma solidity ^0.8.17;

contract ThrowError {
    function justRevert(string memory str) public pure {
        assembly {
            let len := mload(str)
            revert(add(str, 32), len)
        }
    }

    function revertError(string calldata str) public pure {
        revert(str);
    }

    error CustomError(uint256 number);

    function revertCustom(uint256 x) public pure {
        revert CustomError(x);
    }

    function revertPanic() public pure returns (uint256) {
        uint256 x = 1;
        uint256 y = 0;
        return x / y;
    }
}
