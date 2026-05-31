# Deployment logs for deploys that matter

- sepolia

-- deployed with new hardhat deploy tooling, see deployment log for deets
{
SgETH: '0xCF4831EBE785437DC54a90018b1b410Bd16c8533',
WSGETH: '0x514dfd2d10eC6775f030BA2abcf7A2445C0CA6Fb',
SharedDepositMinterV2: '0xd6Ad9a646330F1a937347a5cfaaDE57990109b5C',
PaymentSplitter: '0x38E86964A811Ee66D1139CD97C838B713F63779B',
WithdrawalQueue: '0x93Ec5A17176336C95Bfb537A71130d6eEA6eF73D',
RewardsReceiver: '0xAeBD9A9b883f539894A28CBCD866d50ca34000FD',
MockDepositContract: '0xEb9e7570f8D5ac7D0Abfbed902A784E84dF16a78'
}

-- deployed with old pipeline

{
SgETH: '0xA3A244Db2C07061E159090BB8b354ae4662fB0C3',
WSGETH: '0xc8BD8F8AC1410e6f59a5EeAf7be00703232EcD56',
SharedDepositMinterV2: '0x1974601C7f3A4b3E30A65eFD66f35358390B55a8',
PaymentSplitter: '0xFDCDe0019BffA69B72aC14715b61Cb5A3EdAe1f9',
Withdrawals: '0xA357FA70FCaEa08c467EfB31e082ec933178d1EE',
RewardsReceiver: '0x17A043f3bb5360562301B08D8178731037D2EE4E'
}

- mainnet

```
{ WithdrawalsvETH2: '0xA308f4a980C4a2960e9E87fC51DBf2b0B50CA432' }
```

- goerli new contracts

```
// TODO : log out deploy date like oracleScript
{
  SgETH: '0x0056390361289CAFc3E10b65AC4C49e44C08B7df',
  WSGETH: '0x7b569f6eC245403B5fbF68aDa4aef95cb26b6351',
  SharedDepositMinterV2: '0xb6F4a4ae69df1EB0d7dE4141CAd600104FAC28f6',
  PaymentSplitter: '0xbe145a41e03EDf49d3b373e5248d9D097b707488',
  Withdrawals: '0x4fD099c8Db42E2472fDEc5282bc80EF3C2945E10',
  RewardsReceiver: '0xD4Faa65b21e3323b900579BC7725474561E92684',
  WithdrawalsvETH2: '0x330B12204596812946d010c24b0Da3c8Af37B37c',
  Rollover: '0x8CcE3694d698cb5DF1e1bD8A948899449Ea94ffB'
}
```

## Jul 19 2023

SharedDeposit mainnet RC1 deployed.
Feat. minting Eth liquid staking derivative, rollovers to v2 from v1, withdrawals

SgETH deployed to 0x9e52dB44d62A8c9762FA847Bd2eBa9d0585782d1 at
https://etherscan.io/address/0x9e52dB44d62A8c9762FA847Bd2eBa9d0585782d1

WSGETH deployed to 0x31AA035313b1D2109e61Ee0E3662A86A8615fF1d at
https://etherscan.io/address/0x31AA035313b1D2109e61Ee0E3662A86A8615fF1d

SharedDepositMinterV2 deployed to 0x85Bc06f4e3439d41f610a440Ba0FbE333736B310 at
https://etherscan.io/address/0x85Bc06f4e3439d41f610a440Ba0FbE333736B310

PaymentSplitter deployed to 0x11017593C9BfD1E173ac0c59E2fCca260b10d467 at
https://etherscan.io/address/0x11017593C9BfD1E173ac0c59E2fCca260b10d467

Withdrawals deployed to 0xB4AAd1Fe1AD6153525bAf687e1f200183a030E30 at
https://etherscan.io/address/0xB4AAd1Fe1AD6153525bAf687e1f200183a030E30

RewardsReceiver deployed to 0x4B9BF4DcA2fbF2C6D5266d51254638820243bFaD at
https://etherscan.io/address/0x4B9BF4DcA2fbF2C6D5266d51254638820243bFaD

WithdrawalsvETH2 deployed to 0xed4e21BD620F3C1Fd1853b1C52A9D023C33D83d4 at
https://etherscan.io/address/0xed4e21BD620F3C1Fd1853b1C52A9D023C33D83d4

Rollover deployed to 0x68a31dfD0c81A411C5adadc8A40225425777466C at
https://etherscan.io/address/0x68a31dfD0c81A411C5adadc8A40225425777466C

## Aug 31 '21

NFT
MintableNFTSale deployed to 0x926a65012C23dcfB2227af46e6135C1c6413D8Ac at https://etherscan.io/address/0x926a65012C23dcfB2227af46e6135C1c6413D8Ac
cost: 322125589811035895 or 0.322 ETH

founderVesting deployed to 0x0279eBC54179EBc5E5e65A9f036Db351233adDc6 at https://etherscan.io/address/0x0279eBC54179EBc5E5e65A9f036Db351233adDc6  
treasuryVesting deployed to 0x2Cb4bdc030975f2ABdbbb984e87715505C51D5BC at https://etherscan.io/address/0x2Cb4bdc030975f2ABdbbb984e87715505C51D5BC  
SGTv2 deployed to 0x24C19F7101c1731b85F1127EaA0407732E36EcDD at https://etherscan.io/address/0x24C19F7101c1731b85F1127EaA0407732E36EcDD

TokenMigrator deployed to 0x9615460582Efa2a9b1d8D21e7E02afE43A415E13 at https://etherscan.io/address/0x9615460582Efa2a9b1d8D21e7E02afE43A415E13  
VoteEscrowFactory deployed to 0xeE5bd4b9C875BE3958b1255D181B8B3E978903b9 at https://etherscan.io/address/0xeE5bd4b9C875BE3958b1255D181B8B3E978903b9  
SimpleTimelock deployed to 0xC0AAB794F9D2aA7cE56B8BEB6cFfc71BC05c21FC at https://etherscan.io/address/0xC0AAB794F9D2aA7cE56B8BEB6cFfc71BC05c21FC  
FundDistributor deployed to 0x38aa4CC003D9Ad84505bc7b096122402Db31f708 at https://etherscan.io/address/0x38aa4CC003D9Ad84505bc7b096122402Db31f708  
MasterChef deployed to 0x84B7644095d9a8BFDD2e5bfD8e41740bc1f4f412 at https://etherscan.io/address/0x84B7644095d9a8BFDD2e5bfD8e41740bc1f4f412

VeSGT : 0x21b555305e9d65c8b8ae232e60fd806edc9c5d78 : https://etherscan.io/address/0x21b555305e9d65c8b8ae232e60fd806edc9c5d78#code

# Goerli

## Fri jul 7 23

SharedDepositMinterV2 deployed to 0x1C974Ef3993152eCB53FdCF8b543b39f82122447 at https://goerli.etherscan.io/address/0x1C974Ef3993152eCB53FdCF8b543b39f82122447

PaymentSplitter deployed to 0xa609E0Dd2475739ac705fc17f38D9F5584c2c28D at https://goerli.etherscan.io/address/0xa609E0Dd2475739ac705fc17f38D9F5584c2c28D

Withdrawals deployed to 0x807EB95706E365115adAbeb4884c1Eb39D062A6d at https://goerli.etherscan.io/address/0x807EB95706E365115adAbeb4884c1Eb39D062A6d

RewardsReceiver deployed to 0x67c2F94F308F7fe6Dd1bf1bD7BF55715E1b1579b at https://goerli.etherscan.io/address/0x67c2F94F308F7fe6Dd1bf1bD7BF55715E1b1579b

## Wed jul 6 '23

SharedDepositMinterV2 deployed to 0x711c07cbfb82d5cB6Eb665350237C25c302f4A13 at https://goerli.etherscan.io/address/0x711c07cbfb82d5cB6Eb665350237C25c302f4A13

PaymentSplitter deployed to 0xA64629072cb064B2F3084Ca4C2D9d1e2F5c1fe02 at https://goerli.etherscan.io/address/0xA64629072cb064B2F3084Ca4C2D9d1e2F5c1fe02

Withdrawals deployed to 0x01cF4caDca14a9988F9116d7701494e58E567528 at https://goerli.etherscan.io/address/0x01cF4caDca14a9988F9116d7701494e58E567528

YieldDirector deployed to 0xc539a20b49DDe9a0E86b3FF5e00CCD5519001114 at https://goerli.etherscan.io/address/0xc539a20b49DDe9a0E86b3FF5e00CCD5519001114

RewardsReceiver deployed to 0x3048D0A5813dFcB7aD4Dbb2f747E993aF8b70E8a at https://goerli.etherscan.io/address/0x3048D0A5813dFcB7aD4Dbb2f747E993aF8b70E8a

## Wed jul 5 '23

SharedDepositMinterV2 deployed to 0x5d03e8d58A58244DB0ad5D4CEc7DC7737F2F37a3 at https://goerli.etherscan.io/address/0x5d03e8d58A58244DB0ad5D4CEc7DC7737F2F37a3

## Sun jul 2 '23

SharedDepositMinterV2 deployed to 0x5464Eb94ECf019d5b05099A89dB302cF7ac3e863 at https://goerli.etherscan.io/address/0x5464Eb94ECf019d5b05099A89dB302cF7ac3e863

## Wed Jun 14 '23

SgETH deployed to 0x453B459249F82ba3f369651aD485Fa11C6F082F8 at https://goerli.etherscan.io/address/0x453B459249F82ba3f369651aD485Fa11C6F082F8
WSGETH deployed to 0xbFA813C3266Af70A5Ddc15d9253655281e2bCd23 at https://goerli.etherscan.io/address/0xbFA813C3266Af70A5Ddc15d9253655281e2bCd23
SharedDepositMinter deployed to 0xb5ae9d51858436c23dca94370a38ff495a54873b at https://goerli.etherscan.io/address/0xb5ae9d51858436c23dca94370a38ff495a54873b
PaymentSplitter deployed to 0xC01063EC89B210BE8037d549D618980845657994 at https://goerli.etherscan.io/address/0xC01063EC89B210BE8037d549D618980845657994
Withdrawals deployed to 0x765d0dA8536cE858E0D2B54025b223231db0FeAE at https://goerli.etherscan.io/address/0x765d0dA8536cE858E0D2B54025b223231db0FeAE
ETH2SgETHYieldRedirector deployed to 0x8253F05c5E7b76F5ff855a6D52Ea9B9B5FD666cA at https://goerli.etherscan.io/address/0x8253F05c5E7b76F5ff855a6D52Ea9B9B5FD666cA
RewardsReceiver deployed to 0xC9F2ddBf105ff67c2BA30b2dB968Bc564a16ca67 at https://goerli.etherscan.io/address/0xC9F2ddBf105ff67c2BA30b2dB968Bc564a16ca67
WithdrawalsvETH2 deployed to 0xd70201Ea40c12cFE6Bf69Dc9A2ca9FB14bb8DB0b at https://goerli.etherscan.io/address/0xd70201Ea40c12cFE6Bf69Dc9A2ca9FB14bb8DB0b
Rollover deployed to 0xaa93EF92Ef8663902BeE679B9B8bFB60c966d50C at https://goerli.etherscan.io/address/0xaa93EF92Ef8663902BeE679B9B8bFB60c966d50C

## Wed Jun 7 '23

SgETH deployed to 0xd0f593aeB7E22B1038edC398aA53A56B38435de9 at https://goerli.etherscan.io/address/0xd0f593aeB7E22B1038edC398aA53A56B38435de9
WSGETH deployed to 0xCE066A0C47b95aA7fF53A22D099A1F33F3d7e7D9 at https://goerli.etherscan.io/address/0xCE066A0C47b95aA7fF53A22D099A1F33F3d7e7D9
SharedDepositMinter deployed to 0x62a4f18E1c42c63c6D02668A714eaD7323eF5CE0 at https://goerli.etherscan.io/address/0x62a4f18E1c42c63c6D02668A714eaD7323eF5CE0
PaymentSplitter deployed to 0xBaB96eEEE86b3dc57378C2b95aaFEc0aD3cc1Ed5 at https://goerli.etherscan.io/address/0xBaB96eEEE86b3dc57378C2b95aaFEc0aD3cc1Ed5
Withdrawals deployed to 0x62C4df1d2D30509833dEac78E968762Bf1B0CB6d at https://goerli.etherscan.io/address/0x62C4df1d2D30509833dEac78E968762Bf1B0CB6d
ETH2SgETHYieldRedirector deployed to 0xd810D44Ad63582C457814eD3a47e1d9B83aC2358 at https://goerli.etherscan.io/address/0xd810D44Ad63582C457814eD3a47e1d9B83aC2358
RewardsReceiver deployed to 0xf38bA1f9B416Ce6eB3D9336f417a5Fbf88aEb84F at https://goerli.etherscan.io/address/0xf38bA1f9B416Ce6eB3D9336f417a5Fbf88aEb84F
WithdrawalsvETH2 deployed to 0x0f779f0c7d0c8b9cD6e23e62D9aE51ED39aa256a at https://goerli.etherscan.io/address/0x0f779f0c7d0c8b9cD6e23e62D9aE51ED39aa256a
Rollover deployed to 0x17b9Ee3963a58c82d64Aa9fdaCce261257834623 at https://goerli.etherscan.io/address/0x17b9Ee3963a58c82d64Aa9fdaCce261257834623

May 24 '23
Goerli test of streamlined Withdrawals contract
/// @dev Test on goerli deployed at https://goerli.etherscan.io/address/0x4db116ad5cca33ba5d2956dba80d56f27b6b2455
