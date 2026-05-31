pragma solidity 0.8.7;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Faucet {
    using SafeERC20 for IERC20;

    // Faucet so anyone can get some tokens to play with
    address public lockedToken;
    uint256 public claimAmt;

    constructor(address _lockedToken, uint256 _claimAmt) {
        lockedToken = _lockedToken;
        claimAmt = _claimAmt;
    }

    function claim() external {
        IERC20(lockedToken).safeTransfer(msg.sender, claimAmt);
    }
}
