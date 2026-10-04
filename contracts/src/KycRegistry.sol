// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract KycRegistry {
    address public owner;
    bool public openVerification;
    mapping(address => bool) private _verified;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event VerificationSet(address indexed account, bool verified);
    event OpenVerificationSet(bool enabled);

    error NotOwner();
    error OpenVerificationDisabled();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function isVerified(address account) external view returns (bool) {
        return _verified[account];
    }

    function setVerified(address account, bool verified) external onlyOwner {
        _verified[account] = verified;
        emit VerificationSet(account, verified);
    }

    function setVerifiedBatch(address[] calldata accounts, bool verified) external onlyOwner {
        for (uint256 i; i < accounts.length; ++i) {
            _verified[accounts[i]] = verified;
            emit VerificationSet(accounts[i], verified);
        }
    }

    function setOpenVerification(bool enabled) external onlyOwner {
        openVerification = enabled;
        emit OpenVerificationSet(enabled);
    }

    function verifyMyself() external {
        if (!openVerification) revert OpenVerificationDisabled();
        _verified[msg.sender] = true;
        emit VerificationSet(msg.sender, true);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
