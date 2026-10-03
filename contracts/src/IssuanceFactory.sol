// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ShardToken} from "./ShardToken.sol";
import {Offering, IKycRegistry} from "./Offering.sol";

contract IssuanceFactory {
    struct Issuance {
        address issuer;
        address token;
        address offering;
    }

    struct CreateParams {
        string name;
        string symbol;
        ShardToken.AssetInfo asset;
        uint256 supply;
        uint256 pricePerShard;
        uint256 softCap;
        uint256 hardCap;
        uint256 duration;
    }

    IKycRegistry public immutable kyc;
    address public immutable paymentToken;

    Issuance[] private _issuances;

    event IssuanceCreated(
        uint256 indexed id, address indexed issuer, address token, address offering, string symbol, uint256 supply
    );

    error ZeroAddress();
    error IssuerNotVerified();
    error InvalidSupply();
    error InvalidDuration();

    constructor(address kyc_, address paymentToken_) {
        if (kyc_ == address(0) || paymentToken_ == address(0)) revert ZeroAddress();
        kyc = IKycRegistry(kyc_);
        paymentToken = paymentToken_;
    }

    function createIssuance(CreateParams calldata p) external returns (address token, address offering) {
        if (!kyc.isVerified(msg.sender)) revert IssuerNotVerified();
        if (p.supply == 0) revert InvalidSupply();
        if (p.duration == 0) revert InvalidDuration();

        ShardToken shard = new ShardToken(p.name, p.symbol, p.asset, msg.sender, address(this), p.supply);
        Offering off = new Offering(
            address(shard),
            paymentToken,
            address(kyc),
            msg.sender,
            p.pricePerShard,
            p.softCap,
            p.hardCap,
            block.timestamp + p.duration
        );
        shard.transfer(address(off), p.supply);

        token = address(shard);
        offering = address(off);

        uint256 id = _issuances.length;
        _issuances.push(Issuance({issuer: msg.sender, token: token, offering: offering}));
        emit IssuanceCreated(id, msg.sender, token, offering, p.symbol, p.supply);
    }

    function issuancesCount() external view returns (uint256) {
        return _issuances.length;
    }

    function issuanceAt(uint256 id) external view returns (Issuance memory) {
        return _issuances[id];
    }

    function getIssuances() external view returns (Issuance[] memory) {
        return _issuances;
    }
}
