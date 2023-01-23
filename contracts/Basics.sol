// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
contract Basics {
    uint _value = 2;

    function set(uint value) public {
        _value = value;
    }

    function get() public view returns (uint) {
        return _value;
    }
}
