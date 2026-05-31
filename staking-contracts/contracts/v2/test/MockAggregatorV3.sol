// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title Mock AggregatorV3 for testing
/// @dev Mock implementation of Chainlink AggregatorV3Interface
contract MockAggregatorV3 {
    uint80 public roundId;
    int256 public answer;
    uint256 public startedAt;
    uint256 public updatedAt;
    uint80 public answeredInRound;

    constructor(int256 _answer, uint256 _updatedAt) {
        answer = _answer;
        updatedAt = _updatedAt;
        startedAt = _updatedAt;
        roundId = 1;
        answeredInRound = 1;
    }

    function latestRoundData() external view returns (
        uint80 _roundId,
        int256 _answer,
        uint256 _startedAt,
        uint256 _updatedAt,
        uint80 _answeredInRound
    ) {
        return (roundId, answer, startedAt, updatedAt, answeredInRound);
    }

    function setAnswer(int256 _answer) external {
        answer = _answer;
    }

    function setUpdatedAt(uint256 _updatedAt) external {
        updatedAt = _updatedAt;
    }

    function advanceRound() external {
        roundId++;
        answeredInRound++;
    }
}