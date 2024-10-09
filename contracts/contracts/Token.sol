// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Token is ERC20Permit {
    event InsideTransfer(bool success);

    address public forwarder;

    constructor(
        uint256 initSupply,
        address trustedForwarder
    ) ERC20("Gasless Giftcard", "GLG") ERC20Permit("Gasless Giftcard") {
        forwarder = trustedForwarder;
        _mint(msg.sender, initSupply);
    }

    modifier onlyForwarder() {
        require(
            msg.sender == forwarder,
            "Function can only invoked by forwarder(proxy) contract"
        );
        _;
    }

    function callTransfer(
        address owner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        // emit InsideTransfer(true);
        permit(owner, spender, amount, deadline, v, r, s);
        emit InsideTransfer(true);
    }
}
