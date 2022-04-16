// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Bridge
 * @dev ERC20 with bridge
 */
contract Bridge is ERC20 {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    Counters.Counter private _nonceCounter;

    address immutable _validator;

    mapping(bytes32 => bool) _crossNetworkTransfers;

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

    /**
     * @dev Set validator address, mint tokens to owner
     * @param validator_ Validator address
     */
    constructor(address validator_) ERC20("MyToken", "MTK") {
        _validator = validator_;
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    /**
     * @dev Transfer tokens to another network.
     * @param _to User address to whom tokens should be sent.
     * @param _amount Amount of tokens.
     * @param _networkTo Network ID where to send.
     */
    function swap(address _to, uint256 _amount, uint256 _networkTo) public {
        _nonceCounter.increment();
        _burn(msg.sender, _amount);

        emit SwapInitialized(msg.sender, _to, _amount, block.chainid, _networkTo, _nonceCounter.current());
    }

    /**
     * @dev Provide proof that tokens were sent
     * @param _from Address where tokens were sent from
     * @param _to Address where tokens were sent
     * @param _amount Amount of tokens
     * @param _networkFrom ID from sent network
     * @param _nonce Swap number
     * @param _signature Proof
     */
    function redeem(address _from, address _to, uint256 _amount, uint256 _networkFrom, uint256 _nonce, bytes memory _signature) public {
        bytes32 message = keccak256(abi.encodePacked(_from, _to, _amount, _networkFrom, block.chainid, _nonce));
        bytes32 hashMessage = message.toEthSignedMessageHash();

        require(!_crossNetworkTransfers[hashMessage], "Expired");
        require(hashMessage.recover(_signature) == _validator, "Fail");

        _crossNetworkTransfers[hashMessage] = true;
        _mint(_to, _amount);

        emit Redeem(_from, _to, _amount, _networkFrom, block.chainid, _nonce);
    }
}