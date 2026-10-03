// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20Like {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IKycRegistry {
    function isVerified(address account) external view returns (bool);
}

contract Offering {
    enum Status {
        Active,
        Succeeded,
        Failed
    }

    uint256 private constant SHARD_UNIT = 1e18;

    IERC20Like public immutable shard;
    IERC20Like public immutable paymentToken;
    IKycRegistry public immutable kyc;
    address public immutable issuer;
    uint256 public immutable pricePerShard;
    uint256 public immutable softCap;
    uint256 public immutable hardCap;
    uint256 public immutable deadline;

    Status public status;
    uint256 public totalRaised;
    mapping(address => uint256) public contributions;

    event Contributed(address indexed investor, uint256 amount, uint256 totalRaised);
    event Finalized(Status status, uint256 totalRaised);
    event Claimed(address indexed investor, uint256 shards);

    error ZeroAddress();
    error InvalidParams();
    error NotVerified();
    error NotActive();
    error OfferingEnded();
    error HardCapExceeded();
    error NotFunded();
    error ZeroAmount();
    error CannotFinalizeYet();
    error NotSucceeded();
    error NothingToClaim();
    error TransferFailed();

    constructor(
        address shard_,
        address paymentToken_,
        address kyc_,
        address issuer_,
        uint256 pricePerShard_,
        uint256 softCap_,
        uint256 hardCap_,
        uint256 deadline_
    ) {
        if (shard_ == address(0) || paymentToken_ == address(0) || kyc_ == address(0) || issuer_ == address(0)) {
            revert ZeroAddress();
        }
        if (pricePerShard_ == 0 || softCap_ == 0 || softCap_ > hardCap_ || deadline_ <= block.timestamp) {
            revert InvalidParams();
        }
        shard = IERC20Like(shard_);
        paymentToken = IERC20Like(paymentToken_);
        kyc = IKycRegistry(kyc_);
        issuer = issuer_;
        pricePerShard = pricePerShard_;
        softCap = softCap_;
        hardCap = hardCap_;
        deadline = deadline_;
    }

    function contribute(uint256 amount) external {
        if (status != Status.Active) revert NotActive();
        if (block.timestamp >= deadline) revert OfferingEnded();
        if (!kyc.isVerified(msg.sender)) revert NotVerified();
        if (amount == 0) revert ZeroAmount();

        uint256 newTotal = totalRaised + amount;
        if (newTotal > hardCap) revert HardCapExceeded();
        if (shard.balanceOf(address(this)) < _shardsFor(newTotal)) revert NotFunded();

        contributions[msg.sender] += amount;
        totalRaised = newTotal;
        _pull(msg.sender, amount);

        emit Contributed(msg.sender, amount, newTotal);
    }

    function finalize() external {
        if (status != Status.Active) revert NotActive();
        if (block.timestamp < deadline && totalRaised < hardCap) revert CannotFinalizeYet();

        if (totalRaised >= softCap) {
            status = Status.Succeeded;
            uint256 unsold = shard.balanceOf(address(this)) - _shardsFor(totalRaised);
            _push(paymentToken, issuer, totalRaised);
            if (unsold > 0) _push(shard, issuer, unsold);
        } else {
            status = Status.Failed;
            uint256 all = shard.balanceOf(address(this));
            if (all > 0) _push(shard, issuer, all);
        }

        emit Finalized(status, totalRaised);
    }

    function claim() external {
        if (status != Status.Succeeded) revert NotSucceeded();
        uint256 paid = contributions[msg.sender];
        if (paid == 0) revert NothingToClaim();

        contributions[msg.sender] = 0;
        uint256 shards = _shardsFor(paid);
        _push(shard, msg.sender, shards);

        emit Claimed(msg.sender, shards);
    }

    function shardsFor(uint256 paymentAmount) external view returns (uint256) {
        return _shardsFor(paymentAmount);
    }

    function _shardsFor(uint256 paymentAmount) internal view returns (uint256) {
        return (paymentAmount * SHARD_UNIT) / pricePerShard;
    }

    function _pull(address from, uint256 amount) internal {
        (bool ok, bytes memory data) = address(paymentToken).call(
            abi.encodeCall(IERC20Like.transferFrom, (from, address(this), amount))
        );
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _push(IERC20Like token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(abi.encodeCall(IERC20Like.transfer, (to, amount)));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}
