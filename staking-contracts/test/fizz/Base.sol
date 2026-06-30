// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Actor} from "./Actor.sol";
import {Clamp} from "./utils/Clamp.sol";
import {DecimalPrinter} from "./utils/DecimalPrinter.sol";
import {Deployer} from "./utils/Deployer.sol";
import {vm} from "./utils/Hevm.sol";
import {Math} from "./utils/Math.sol";
import {StringUtils} from "./utils/StringUtils.sol";
import {StToken} from "contracts/v2/modular-staking/StToken.sol";
import {WstToken} from "contracts/v2/modular-staking/WstToken.sol";
import {StakingRouter} from "contracts/v2/modular-staking/StakingRouter.sol";
import {ValidatorModule} from "contracts/v2/modular-staking/modules/ValidatorModule.sol";
import {WithdrawalQueueV2} from "contracts/v2/modular-staking/WithdrawalQueueV2.sol";
import {FeeController} from "contracts/v2/modular-staking/FeeController.sol";
import {MockBeaconDeposit} from "contracts/v2/test/MockBeaconDeposit.sol";

abstract contract Base is StringUtils, Clamp, Deployer, Math {
    using DecimalPrinter for uint256;

    string[] internal ACTOR_LABELS = ["Alice", "Bob", "Charlie"];
    uint256 internal constant BLOCK_INTERVAL = 12 seconds;
    uint256 internal constant INITIAL_ETH_BALANCE = 1_000 ether;
    uint256 internal constant MIN_WITHDRAWAL = 0.01 ether;
    uint256 internal constant MAX_HANDLER_DEPOSIT = 64 ether;
    uint256 internal constant MAX_HANDLER_WITHDRAWAL = 10 ether;
    uint256 internal constant MAX_BATCH_WITHDRAWALS = 4;

    bytes32 public constant SOLO = keccak256("FIZZ_SOLO");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE");
    bytes32 public constant NODE_OPERATOR_ROLE = keccak256("NODE_OPERATOR");

    address internal gov = address(0xA11CE);
    address internal oracle = address(0x0A11CE);
    address internal nodeOperator = address(0xB0B);
    address internal treasury = address(0x7EEA5);
    address internal operator = address(0x0FEE);
    bytes32 internal expectedWithdrawalCredentials = keccak256("FIZZ_WITHDRAWAL_CREDENTIALS");

    struct Ghosts {
        uint256 totalDeposited;
        uint256 validatorsPushed;
        uint256 successfulReports;
        uint256 withdrawalRequests;
        uint256 finalizedRequests;
        uint256 claimedRequests;
        bool insolvencyObserved;
    }

    Ghosts internal ghosts;

    address[] internal actors;
    address internal actor;
    address internal admin;

    StToken public stToken;
    WstToken public wstToken;
    StakingRouter public stakingRouter;
    ValidatorModule public validatorModule;
    WithdrawalQueueV2 public withdrawalQueueV2;
    FeeController public feeController;
    MockBeaconDeposit public mockBeaconDeposit;

    modifier asActor() virtual {
        vm.startPrank(actor);
        _;
        vm.stopPrank();
    }

    modifier asAdmin() virtual {
        vm.startPrank(admin);
        _;
        vm.stopPrank();
    }

    function setup() internal {
        admin = address(this);
        vm.label(admin, "Admin");
        vm.label(gov, "Gov");
        vm.label(oracle, "Oracle");
        vm.label(nodeOperator, "NodeOperator");
        vm.label(treasury, "Treasury");
        vm.label(operator, "Operator");

        stToken = new StToken();
        wstToken = new WstToken(address(stToken));
        feeController = new FeeController(
            gov,
            treasury,
            operator,
            address(0),
            address(0),
            1000,
            5000,
            5000,
            0
        );

        StakingRouter routerImpl = new StakingRouter();
        stakingRouter = StakingRouter(
            payable(
                address(
                    new ERC1967Proxy(
                        address(routerImpl),
                        abi.encodeCall(StakingRouter.initialize, (address(stToken), gov))
                    )
                )
            )
        );

        mockBeaconDeposit = new MockBeaconDeposit();
        ValidatorModule moduleImpl = new ValidatorModule();
        validatorModule = ValidatorModule(
            payable(
                address(
                    new ERC1967Proxy(
                        address(moduleImpl),
                        abi.encodeCall(
                            ValidatorModule.initialize,
                            (address(stakingRouter), SOLO, gov, address(mockBeaconDeposit))
                        )
                    )
                )
            )
        );

        withdrawalQueueV2 = new WithdrawalQueueV2(address(stToken), gov);

        stToken.addMinter(address(stakingRouter));
        stToken.addMinter(address(withdrawalQueueV2));

        vm.startPrank(gov);
        stakingRouter.setFeeController(address(feeController));
        stakingRouter.registerModule(SOLO, address(validatorModule), 0);
        stakingRouter.setDefaultModule(SOLO);
        validatorModule.grantRole(ORACLE_ROLE, oracle);
        validatorModule.grantRole(NODE_OPERATOR_ROLE, nodeOperator);
        validatorModule.setExpectedWithdrawalCredentials(expectedWithdrawalCredentials);
        vm.stopPrank();

        setupActors();
    }

    function setupActors() internal {
        for (uint256 i; i < ACTOR_LABELS.length; i++) {
            address _actor = address(new Actor{value: INITIAL_ETH_BALANCE}());
            actors.push(_actor);
            vm.label(_actor, ACTOR_LABELS[i]);
        }
        actor = actors[0];
    }

    function selectActor(uint256 entropy) internal returns (address selected) {
        selected = actors[entropy % actors.length];
        actor = selected;
    }

    function toActor(address addy) internal view returns (address) {
        return actors[uint256(uint160(addy)) % actors.length];
    }

    function toActorNotCurrent(address addy) internal view returns (address) {
        address _actor = actors[uint256(uint160(addy)) % actors.length];
        if (_actor == actor) {
            _actor = actors[(uint256(uint160(addy)) + 1) % actors.length];
        }
        return _actor;
    }

    function sumActorStTokenBalances() internal view returns (uint256 sumOfBalances) {
        for (uint256 i; i < actors.length; i++) {
            sumOfBalances += stToken.balanceOf(actors[i]);
            sumOfBalances += wstToken.getStTokenByWstToken(wstToken.balanceOf(actors[i]));
        }
    }

    function makeBytes(uint256 seed, uint256 length) internal pure returns (bytes memory out) {
        out = new bytes(length);
        bytes32 hash = keccak256(abi.encode(seed));
        for (uint256 i; i < length; i++) {
            out[i] = hash[i % 32];
        }
    }

    function withdrawalCredentialsBytes() internal view returns (bytes memory out) {
        out = new bytes(32);
        bytes32 value = expectedWithdrawalCredentials;
        assembly {
            mstore(add(out, 32), value)
        }
    }

    function skipBlocks(uint256 blocks) internal {
        vm.roll(block.number + blocks);
        vm.warp(block.timestamp + blocks * BLOCK_INTERVAL);
    }

    function skipTime(uint256 time) internal {
        uint256 blocks = (time + BLOCK_INTERVAL - 1) / BLOCK_INTERVAL;
        vm.roll(block.number + blocks);
        vm.warp(block.timestamp + time);
    }
}
