import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { TaskArguments } from "hardhat/types";

task("sign", "Sign message")
  .addParam("from", "From address")
  .addParam("to", "To address")
  .addParam("amount", "Amount")
  .addParam("nfrom", "ID network from")
  .addParam("nto", "ID network to")
  .setAction(async (taskArgs: TaskArguments, hre) => {
    const { from, to, amount, nfrom, nto } = taskArgs;
    const [owner]: SignerWithAddress[] = await hre.ethers.getSigners();
    const msg = hre.ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint8", "uint8"],
      [from, to, amount, nfrom, nto]
    );
    const signature = await owner.signMessage(hre.ethers.utils.arrayify(msg));
    console.log(signature);
  });
