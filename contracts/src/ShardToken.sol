// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ShardToken {
    struct AssetInfo {
        string assetType;
        string unit;
        uint256 quantity;
        string campaign;
    }

    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    address public immutable issuer;

    AssetInfo private _asset;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor(
        string memory name_,
        string memory symbol_,
        AssetInfo memory asset_,
        address issuer_,
        address initialHolder,
        uint256 supply
    ) {
        if (issuer_ == address(0) || initialHolder == address(0)) revert ZeroAddress();
        name = name_;
        symbol = symbol_;
        _asset = asset_;
        issuer = issuer_;
        totalSupply = supply;
        balanceOf[initialHolder] = supply;
        emit Transfer(address(0), initialHolder, supply);
    }

    function asset() external view returns (AssetInfo memory) {
        return _asset;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert InsufficientAllowance();
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();
        if (balanceOf[from] < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] -= amount;
        }
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
