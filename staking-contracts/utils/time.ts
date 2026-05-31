import {ethers} from "hardhat";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function advanceBlock(): Promise<any> {
  return ethers.provider.send("evm_mine", []);
}

export async function advanceBlockTo(blockNumber: number): Promise<void> {
  const now = await ethers.provider.getBlockNumber();
  for (let i = now; i < blockNumber; i++) {
    await advanceBlock();
  }
}

export async function advanceBlockBy(blockAmount: number): Promise<void> {
  for (let i = 0; i < blockAmount; i++) {
    await advanceBlock();
  }
}

export async function advanceTime(time: number): Promise<void> {
  await ethers.provider.send("evm_increaseTime", [time]);
}

export async function advanceTimeAndBlock(time: number): Promise<void> {
  await advanceTime(time);
  await advanceBlock();
}

export async function setTime(time: number): Promise<void> {
  await ethers.provider.send("evm_setNextBlockTimestamp", [time]);
  await advanceBlock();
}

export async function getTime(): Promise<number> {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  const time = block!.timestamp;
  return time;
}

class Time {
  t: number;
  constructor(ms: number) {
    this.t = ms;
  }

  public toSec = (): number => {
    return this.t / 1000;
  };

  public toMin = (): number => {
    return this.t / (1000 * 60);
  };

  public toHr = (): number => {
    return this.t / (1000 * 60 * 60);
  };

  static fromSec = (s: number): Time => {
    const time = new Time(s * 1000);
    return time;
  };

  static fromMin = (m: number): Time => {
    const time = new Time(m * 1000 * 60);
    return time;
  };

  static fromHr = (h: number): Time => {
    const time = new Time(h * 1000 * 60 * 60);
    return time;
  };

  static fromDay = (d: number): Time => {
    const time = new Time(d * 1000 * 60 * 60 * 24);
    return time;
  };

  static fromNow = (ms = 0): Time => {
    const time = new Time(Date.now() + ms);
    return time;
  };

  static fromDate = (strDate: string): Time => {
    const datum = Date.parse(strDate);
    const time = new Time(datum);
    return time;
  };

  public delay = (): Promise<PromiseConstructor> => {
    return new Promise(resolve => setTimeout(resolve, this.t));
  };

  static delay = (ms: number): Promise<PromiseConstructor> => {
    const time = new Time(ms);
    return new Promise(resolve => setTimeout(resolve, time.t));
  };
}

export default Time;
