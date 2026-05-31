// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FundDistributor is Ownable, Initializable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public reward;
    uint256 public missingDecimals;

    // CONTRACTS
    mapping(address => bool) public requesters;

    /* ========== EVENTS ========================= */

    event RequesterAdded(address indexed requester);
    event RequesterRemoved(address indexed requester);
    event FundRequested(uint256 indexed amount);

    /* ========== MODIFIER ========== */

    modifier onlyRequester() {
        require(requesters[_msgSender()], "FD:NA");
        _;
    }

    function initialize(address _reward) external initializer {
        reward = IERC20(_reward);
        missingDecimals = 18 - ERC20(_reward).decimals();
    }

    /* ========== MUTATIVE ====================== */

    function distributeTo(address _receiver, uint256 _amount) external onlyRequester {
        require(_receiver != address(0), "FD:0AD");
        if (_amount > 0) {
            IERC20(reward).safeTransfer(_receiver, _amount.div(10 ** missingDecimals));
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function addRequester(address _requester) external onlyOwner {
        require(!requesters[_requester], "FD:AE");
        requesters[_requester] = true;
        emit RequesterAdded(_requester);
    }

    function removeRequester(address _requester) external onlyOwner {
        require(requesters[_requester], "FD:NA");
        delete requesters[_requester];
        emit RequesterRemoved(_requester);
    }
}
