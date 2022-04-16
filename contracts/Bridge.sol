// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Bridge is ERC20 {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    Counters.Counter private _nonce;

    address immutable _validator;

    mapping(bytes32 => bool) _crossChainTransfers;

    event SwapInitialized(
        address from,
        address to,
        uint256 amount,
        uint256 networkFrom,
        uint256 networkTo,
        uint256 nonce
    );
    event Redeem(
        address from,
        address to,
        uint256 amount,
        uint256 networkFrom,
        uint256 networkTo,
        uint256 nonce
    );

    constructor(address validator_) ERC20("MyToken", "MTK") {
        _validator = validator_;
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    function swap(address to, uint256 amount, uint256 networkTo) public {
        _nonce.increment();
        _burn(msg.sender, amount);

        emit SwapInitialized(msg.sender, to, amount, block.chainid, networkTo, _nonce.current());
    }

    function redeem(address from, address to, uint256 amount, uint256 networkFrom, uint256 nonce, bytes memory signature) public {
        bytes32 message = keccak256(abi.encodePacked(from, to, amount, networkFrom, block.chainid, nonce));
        bytes32 hashMessage = message.toEthSignedMessageHash();

        require(!_crossChainTransfers[hashMessage], "Expired");
        require(hashMessage.recover(signature) == _validator, "Fail");

        _crossChainTransfers[hashMessage] = true;
        _mint(to, amount);

        emit Redeem(from, to, amount, networkFrom, block.chainid, nonce);
    }
}