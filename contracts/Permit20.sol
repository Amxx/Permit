// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./EIP712WithNonce.sol";

abstract contract Permit20 is EIP712WithNonce {
    bytes32 private immutable _PERMIT20_TYPEHASH = keccak256("Permit20(address registry,address to,uint256 value,uint256 nonce,uint256 deadline,address relayer)");

    function transfer20WithSign(
        IERC20 registry,
        address from,
        address to,
        uint256 value,
        uint256 nonce,
        uint256 deadline,
        address relayer,
        bytes memory signature
    )
        external
    {
        require(block.timestamp <= deadline, "NFTPermit::transfer20WithSign: Expired deadline");
        require(relayer == address(0) || relayer == msg.sender);
        _verifyAndConsumeNonce(from, nonce);
        require(
            SignatureChecker.isValidSignatureNow(
                from,
                _hashTypedDataV4(keccak256(abi.encode(
                    _PERMIT20_TYPEHASH,
                    registry,
                    to,
                    value,
                    nonce,
                    deadline,
                    relayer
                ))),
                signature
            ),
            "NFTPermit::transfer20WithSign: Invalid signature"
        );

        registry.transferFrom(from, to, value);
    }
}
