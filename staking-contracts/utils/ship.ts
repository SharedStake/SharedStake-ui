import hardhatRuntimeEnvironment, {ethers} from "hardhat";
import {Contract, ContractFactory} from "ethers";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployOptions, DiamondOptions} from "hardhat-deploy/types";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

type Modify<T, R> = Omit<T, keyof R> & R;
type DeployParam<T extends ContractFactory> = Parameters<InstanceType<{new (): T}>["deploy"]>;
type ReturnTypeIfContract<T> = T extends Contract ? T : never;
type ContractInstance<T extends ContractFactory> = ReturnTypeIfContract<InstanceType<{new (): T}>["attach"]>;

export interface Accounts {
  [name: string]: SignerWithAddress;
}

class Ship {
  public accounts: Accounts;
  public users: SignerWithAddress[];
  public hre: HardhatRuntimeEnvironment;
  private log: boolean | undefined;

  constructor(hre: HardhatRuntimeEnvironment, accounts: Accounts, users: SignerWithAddress[], log?: boolean) {
    this.hre = hre;
    this.log = log;
    this.users = users;
    this.accounts = accounts;
  }

  static init = async (hre: HardhatRuntimeEnvironment = hardhatRuntimeEnvironment, log?: boolean): Promise<Ship> => {
    const namedAccounts = await hre.getNamedAccounts();
    const accounts: Accounts = {};
    const users: SignerWithAddress[] = [];
    for (const [name, address] of Object.entries(namedAccounts)) {
      const signer = await ethers.getSigner(address);
      accounts[name] = signer;
    }
    const unnammedAccounts = await hre.getUnnamedAccounts();
    for (const address of unnammedAccounts) {
      const signer = await ethers.getSigner(address);
      users.push(signer);
    }
    const ship = new Ship(hre, accounts, users, log);
    return ship;
  };

  get addresses(): string[] {
    const addresses: string[] = [];
    for (const [, user] of Object.entries(this.users)) {
      addresses.push(user.address);
    }
    return addresses;
  }

  get provider() {
    return this.hre.ethers.provider;
  }

  address = async <T extends ContractFactory>(contractFactory: new () => T) => {
    const contractName = contractFactory.name.split("__")[0];
    const dep = await this.hre.deployments.getOrNull(contractName);
    return dep?.address;
  };

  deployed = async (address: string) => {
    return await this.hre.ethers.provider.getCode(address).then(code => code.length > 2);
  };

  deploy = async <T extends ContractFactory>(
    contractFactory: new () => T,
    option?: Modify<
      DeployOptions,
      {
        from?: SignerWithAddress;
        args?: DeployParam<T>;
        log?: boolean;
        aliasName?: string | null;
      }
    >,
  ) => {
    const contractName = contractFactory.name.split("__")[0];

    const aliasName = option?.aliasName ?? contractName;

    const from = option?.from || this.accounts.deployer;
    const fromAddr = from.address;

    let log = option?.log || this.log;
    if (log === undefined) {
      if (this.hre.network.name !== "hardhat") {
        log = true;
      } else {
        log = false;
      }
    }

    const deployResult = await this.hre.deployments.deploy(aliasName, {
      ...option,
      contract: contractName,
      from: fromAddr,
      args: option?.args,
      log,
      waitConfirmations: option?.waitConfirmations ?? (this.hre.network.name === "mainnet" ? 5 : 1),
      verify: option?.verify ?? false,
    });

    const contract = (await ethers.getContractAt(contractName, deployResult.address, from)) as ContractInstance<T>;

    return {
      contract,
      ...deployResult,
    };
  };

  // deployDiamond = async (
  //   name: string,
  //   facets: (new () => ContractFactory)[],
  //   initializer: new () => ContractFactory,
  //   initializeFunction: string,
  //   args?: (string | number | bigint | boolean)[],
  //   option?: Modify<
  //     DiamondOptions,
  //     {
  //       from?: SignerWithAddress;
  //       log?: boolean;
  //     }
  //   >,
  // ) => {
  //   const facetNames = facets.map(facet => facet.name.split("__")[0]);
  //   const initializerName = initializer.name.split("__")[0];

  //   const from = option?.from || this.accounts.deployer;
  //   const fromAddr = from.address;

  //   let log = option?.log || this.log;
  //   if (log === undefined) {
  //     if (this.hre.network.name !== "hardhat") {
  //       log = true;
  //     } else {
  //       log = false;
  //     }
  //   }

  //   const deployResult = await this.hre.deployments.diamond.deploy(name, {
  //     ...option,
  //     facets: facetNames,
  //     execute: {
  //       contract: initializerName,
  //       methodName: initializeFunction,
  //       args: args ?? [],
  //     },
  //     from: fromAddr,
  //     log,
  //     waitConfirmations: 1,
  //   });

  //   return {
  //     ...deployResult,
  //   };
  // };

  connect = async <T extends ContractFactory>(
    contractFactory: (new () => T) | string,
    newAddress?: string,
  ): Promise<ContractInstance<T>> => {
    const contractName = typeof contractFactory == "string" ? contractFactory : contractFactory.name.split("__")[0];

    if (newAddress) {
      const factory = (await ethers.getContractFactory(contractName, this.accounts.deployer)) as T;
      return factory.attach(newAddress) as ContractInstance<T>;
    } else {
      return (await ethers.getContract(contractName, this.accounts.deployer)) as ContractInstance<T>;
    }
  };
}

export default Ship;
