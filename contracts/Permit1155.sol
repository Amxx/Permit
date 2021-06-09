// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./EIP712WithNonce.sol";

abstract contract Permit1155 is EIP712WithNonce {
    bytes32 private immutable _PERMIT1155_TYPEHASH = keccak256("Permit1155(address registry,uint256 tokenid,address to,uint256 value,uint256 nonce,uint256 deadline,bytes data)");

    function transfer1155WithSign(
        IERC1155 registry,
        uint256 tokenId,
        address from,
        address to,
        uint256 value,
        uint256 deadline,
        bytes memory data,
        bytes memory signature
    )
        external
    {
        require(block.timestamp <= deadline, "NFTPermit::transfer1155WithSign: Expired deadline");

        require(
            SignatureChecker.isValidSignatureNow(
                from,
                _hashTypedDataV4(keccak256(abi.encode(
                    _PERMIT1155_TYPEHASH,
                    registry,
                    tokenId,
                    to,
                    value,
                    _useNonce(from),
                    deadline,
                    keccak256(data)
                ))),
                signature
            ),
            "NFTPermit::transfer1155WithSign: Invalid signature"
        );

        registry.safeTransferFrom(from, to, tokenId, value, data);
    }
}
