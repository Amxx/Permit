// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./EIP712WithNonce.sol";

abstract contract Permit721 is EIP712WithNonce {
    bytes32 private immutable _PERMIT721_TYPEHASH = keccak256("Permit721(address registry,uint256 tokenid,address to,uint256 nonce,uint256 deadline,address relayer)");

    function transfer721WithSign(
        IERC721 registry,
        uint256 tokenId,
        address to,
        uint256 nonce,
        uint256 deadline,
        address relayer,
        bytes memory signature
    )
        external
    {
        address from = registry.ownerOf(tokenId);

        require(block.timestamp <= deadline, "NFTPermit::transfer721WithSign: Expired deadline");
        require(relayer == address(0) || relayer == msg.sender);
        _verifyAndConsumeNonce(from, nonce);
        require(
            SignatureChecker.isValidSignatureNow(
                from,
                _hashTypedDataV4(keccak256(abi.encode(
                    _PERMIT721_TYPEHASH,
                    registry,
                    tokenId,
                    to,
                    nonce,
                    deadline,
                    relayer
                ))),
                signature
            ),
            "NFTPermit::transfer721WithSign: Invalid signature"
        );

        registry.safeTransferFrom(from, to, tokenId);
    }
}
