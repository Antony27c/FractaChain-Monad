// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IShardLike {
    function issuer() external view returns (address);
    function totalSupply() external view returns (uint256);
}

/// Liquidación de la cosecha: el emisor deposita el USDC de la venta del lote y cada
/// tenedor canjea sus shards por su parte proporcional. Los shards canjeados quedan
/// bloqueados en este contrato para siempre.
contract HarvestRedemption {
    struct Settlement {
        uint256 amount;
        uint256 totalSupply;
        uint256 redeemedShards;
        uint256 paidOut;
        uint64 settledAt;
        bytes32 evidenceHash;
        string evidenceURI;
    }

    address public immutable paymentToken;

    mapping(address token => Settlement) private _settlements;
    uint256 private _locked;

    event Settled(
        address indexed token,
        address indexed issuer,
        uint256 amount,
        uint256 totalSupply,
        bytes32 evidenceHash,
        string evidenceURI
    );
    event Redeemed(address indexed token, address indexed holder, uint256 shards, uint256 payout);

    error ZeroAddress();
    error NotIssuer();
    error AlreadySettled();
    error NotSettled();
    error ZeroAmount();
    error ExceedsSettlement();
    error TransferFailed();
    error ReentrantCall();

    modifier nonReentrant() {
        if (_locked != 0) revert ReentrantCall();
        _locked = 1;
        _;
        _locked = 0;
    }

    constructor(address paymentToken_) {
        if (paymentToken_ == address(0)) revert ZeroAddress();
        paymentToken = paymentToken_;
    }

    /// El emisor del lote deposita lo recaudado por la venta de la cosecha, con la
    /// referencia a la evidencia (por ejemplo, la liquidación del acopio).
    function settle(address token, uint256 amount, string calldata evidenceURI, bytes32 evidenceHash)
        external
        nonReentrant
    {
        if (msg.sender != IShardLike(token).issuer()) revert NotIssuer();
        Settlement storage s = _settlements[token];
        if (s.settledAt != 0) revert AlreadySettled();
        if (amount == 0) revert ZeroAmount();
        uint256 supply = IShardLike(token).totalSupply();
        if (supply == 0) revert ZeroAmount();

        s.amount = amount;
        s.totalSupply = supply;
        s.settledAt = uint64(block.timestamp);
        s.evidenceHash = evidenceHash;
        s.evidenceURI = evidenceURI;
        _call(paymentToken, abi.encodeWithSelector(0x23b872dd, msg.sender, address(this), amount));

        emit Settled(token, msg.sender, amount, supply, evidenceHash, evidenceURI);
    }

    /// Canjea `shards` por USDC al valor de liquidación.
    function redeem(address token, uint256 shards) external nonReentrant returns (uint256 payout) {
        Settlement storage s = _settlements[token];
        if (s.settledAt == 0) revert NotSettled();
        payout = (shards * s.amount) / s.totalSupply;
        if (payout == 0) revert ZeroAmount();
        if (s.redeemedShards + shards > s.totalSupply || s.paidOut + payout > s.amount) revert ExceedsSettlement();

        s.redeemedShards += shards;
        s.paidOut += payout;
        _call(token, abi.encodeWithSelector(0x23b872dd, msg.sender, address(this), shards));
        _call(paymentToken, abi.encodeWithSelector(0xa9059cbb, msg.sender, payout));

        emit Redeemed(token, msg.sender, shards, payout);
    }

    function quote(address token, uint256 shards) external view returns (uint256) {
        Settlement storage s = _settlements[token];
        return s.settledAt == 0 ? 0 : (shards * s.amount) / s.totalSupply;
    }

    function isSettled(address token) external view returns (bool) {
        return _settlements[token].settledAt != 0;
    }

    function settlementOf(address token) external view returns (Settlement memory) {
        return _settlements[token];
    }

    function _call(address token, bytes memory data) private {
        (bool ok, bytes memory ret) = token.call(data);
        if (!ok || (ret.length != 0 && !abi.decode(ret, (bool)))) revert TransferFailed();
    }
}
