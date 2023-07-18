pragma solidity ^0.8.17;

contract Counter {
    uint256 public counter = 0;

    function inc() public returns (uint256) {
        return ++counter;
    }
}