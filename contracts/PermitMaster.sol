// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Multicall.sol";
import "./Permit20.sol";
import "./Permit721.sol";
import "./Permit1155.sol";

contract PermitMaster is Permit20, Permit721, Permit1155, Multicall {
    constructor(string memory name)
    EIP712(name, "1")
    {}
}
