// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
// amount, from, to, networkFrom, networkTo
// поулчил event => подписал сообщение с backend

// 1. Отправил транзакцию swap, emit Swap
// 2. Прослушивает swap event, подписал параметры с backend, вернул пользователю
// 3. redeem - проверил подпись и получил токены

contract Bridge is ERC20 {
    using ECDSA for bytes32;

    address immutable _validator;

    mapping(bytes32 => bool) _crossChainTransfers;

    event SwapInitialized(address from, address to, uint256 amount, uint256 networkFrom, uint256 networkTo);
    event Redeem(address from, address to, uint256 amount, uint256 networkFrom, uint256 networkTo);

    constructor(address validator_) ERC20("MyToken", "MTK") {
        _validator = validator_;
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    function swap(address to, uint256 amount, uint256 networkTo) public {
        _burn(msg.sender, amount);

        emit SwapInitialized(msg.sender, to, amount, block.chainid, networkTo);
    }

    function redeem(address from, address to, uint256 amount, uint256 networkFrom, bytes memory signature) public {
        bytes32 message = keccak256(abi.encodePacked(from, to, amount, networkFrom, block.chainid));
        bytes32 hashMessage = message.toEthSignedMessageHash();

        require(!_crossChainTransfers[hashMessage], "Expired");
        require(hashMessage.recover(signature) == _validator, "Fail");

        _crossChainTransfers[hashMessage] = true;
        _mint(to, amount);

        emit Redeem(from, to, amount, networkFrom, block.chainid);
    }
}