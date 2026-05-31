// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

interface IStakingRouterLite {
    enum ModuleStatus {
        Active,
        DepositsPaused,
        Stopped
    }

    struct ModuleView {
        address module;
        ModuleStatus status;
        uint16 targetShareBps;
        uint16 maxShareBps;
        uint16 moduleFeeBps;
        uint16 treasuryFeeBps;
        uint64 availableValidatorKeys;
        uint64 depositedValidatorCount;
        uint64 exitedValidatorCount;
    }
}

