import chai, { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";

chai.use(require("chai-bignumber")());

describe("Tokens with bridge", function () {
  let rinkebyToken: Contract;
  let binanceToken: Contract;
  let owner: SignerWithAddress;
  let validator: SignerWithAddress;
  let addr1: SignerWithAddress;
  let clean: string;
  let from: string, to: string;

  const AMOUNT = 100;
  const NETWORK_ID = <number>network.config.chainId;

  async function getSignature(
    from: string,
    to: string,
    amount: number | string,
    networkFromId = NETWORK_ID,
    networkToId = NETWORK_ID
  ) {
    const msg = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256"],
      [from, to, amount, networkFromId, networkToId]
    );
    return await validator.signMessage(ethers.utils.arrayify(msg));
  }

  before(async () => {
    [owner, validator, addr1] = await ethers.getSigners();
    const MyTokenFactory = await ethers.getContractFactory("Bridge");
    rinkebyToken = await MyTokenFactory.deploy(validator.address);
    binanceToken = await MyTokenFactory.deploy(validator.address);

    from = owner.address;
    to = addr1.address;

    clean = await network.provider.send("evm_snapshot");
  });

  afterEach(async () => {
    await network.provider.send("evm_revert", [clean]);
    clean = await network.provider.send("evm_snapshot");
  });

  describe("redeem", () => {
    it("should increase recipient balance", async () => {
      await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

      const startBalance = await binanceToken.balanceOf(addr1.address);
      const signature = await getSignature(from, to, AMOUNT);
      await binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, signature);

      const finalBalance = await binanceToken.balanceOf(addr1.address);
      expect(finalBalance).to.be.eq(startBalance.add(AMOUNT));
    });
    it("should revert if calls twice", async () => {
      await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

      const signature = await getSignature(from, to, AMOUNT);
      await binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, signature);

      const tx = binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, signature);
      const reason = "Expired";
      await expect(tx).to.be.revertedWith(reason);
    });
    it("should revert if to is incorrect", async () => {
      await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

      const signature = await getSignature(from, to, AMOUNT);

      const tx = binanceToken.redeem(to, from, AMOUNT, NETWORK_ID, signature);
      const reason = "Fail";
      await expect(tx).to.be.revertedWith(reason);
    });
    it("should revert if from is incorrect", async () => {
      await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

      const signature = await getSignature(from, to, AMOUNT);

      const tx = binanceToken.redeem(to, to, AMOUNT, NETWORK_ID, signature);
      const reason = "Fail";
      await expect(tx).to.be.revertedWith(reason);
    });
    it("should revert if amount is incorrect", async () => {
      await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

      const signature = await getSignature(from, to, AMOUNT);

      const tx = binanceToken.redeem(
        from,
        to,
        AMOUNT + 1,
        NETWORK_ID,
        signature
      );
      const reason = "Fail";
      await expect(tx).to.be.revertedWith(reason);
    });
    it("should revert if signature is incorrect", async () => {
      await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

      const signature = await getSignature(from, to, AMOUNT + 555);

      const tx = binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, signature);
      const reason = "Fail";
      await expect(tx).to.be.revertedWith(reason);
    });
  });
});
