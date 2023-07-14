pragma solidity ^0.8.17;

contract TestContract {
    string public name = "Test Test Test";

    function compare(int256 a, int256 b) pure public returns (int) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }

    function hash(uint256 a) pure public returns (uint256) {
        unchecked {
            a += 10;
        }
        return uint256(keccak256(abi.encode(a)));
    }

    struct Vec2 {
        int256 x;
        int256 y;
    }

    function swapXY(Vec2 memory v) pure public returns (Vec2 memory) {
        int256 t = v.x;
        v.x = v.y;
        v.y = t;
        return v;
    }
}