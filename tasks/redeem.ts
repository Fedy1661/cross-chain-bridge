import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("redeem", "Redeem tokens")
  .addParam("contract", "Contract address")
  .addParam("from", "From address")
  .addParam("to", "To address")
  .addParam("amount", "Amount")
  .addParam("nfrom", "ID network from")
  .addParam("nonce", "Nonce")
  .addParam("signature", "Signature")
  .setAction(async (taskArgs: TaskArguments, hre) => {
    const { contract, from, to, amount, nfrom, nonce, signature } = taskArgs;
    const bridge = await hre.ethers.getContractAt("Bridge", contract);

    const tx = await bridge.redeem(from, to, amount, nfrom, nonce, signature);
    await tx.wait();
  });
