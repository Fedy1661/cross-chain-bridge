import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy(process.env.VALIDATOR);

  await bridge.deployed();

  console.log("Bridge deployed to:", bridge.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
