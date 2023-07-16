pragma solidity ^0.8.17;

contract GasAndValueTester {
    function testValue(uint256 expectedValue) public payable returns (bool) {
        return msg.value == expectedValue;
    }

    // should revert when gas is very smol
    function testGas(uint256 runTimes) public pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < runTimes; ++i) {
            sum += i * i;
        }
        return sum;
    }

    function testValueAndGas(
        uint256 expectedValue,
        uint256 runTimes
    ) public payable returns (bool okValue, uint256 sum) {
        okValue = testValue(expectedValue);
        sum = testGas(runTimes);
    }
}
