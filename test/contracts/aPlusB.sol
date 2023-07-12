// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract aPlusB {
    function plus(int256 a, int256 b) external pure returns (int256) {
        return a + b;
    }

    function minus(int256 a, int256 b) external pure returns (int256) {
        return a - b;
    }
}
