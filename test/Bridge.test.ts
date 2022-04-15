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
  let nonce: number = 0;

  const AMOUNT = 100;
  const NETWORK_ID = <number>network.config.chainId;

  async function getSignature(
    from: string,
    to: string,
    amount: number | string,
    nonce: number | string,
    networkFromId = NETWORK_ID,
    networkToId = NETWORK_ID
  ) {
    const msg = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256", "uint256"],
      [from, to, amount, networkFromId, networkToId, nonce]
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
    nonce = 0;

    clean = await network.provider.send("evm_snapshot");
  });

  afterEach(async () => {
    await network.provider.send("evm_revert", [clean]);
    clean = await network.provider.send("evm_snapshot");
    nonce = 0;
  });

  it("should increase recipient balance", async () => {
    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

    const startBalance = await binanceToken.balanceOf(addr1.address);
    const signature = await getSignature(from, to, AMOUNT, ++nonce);
    await binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, nonce, signature);

    const finalBalance = await binanceToken.balanceOf(addr1.address);
    expect(finalBalance).to.be.eq(startBalance.add(AMOUNT));
  });
  it("the repeated swap will be successful", async () => {
    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

    const startBalance = await binanceToken.balanceOf(addr1.address);
    let signature = await getSignature(from, to, AMOUNT, ++nonce);
    await binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, nonce, signature);

    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);
    signature = await getSignature(from, to, AMOUNT, ++nonce);
    await binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, nonce, signature);

    const finalBalance = await binanceToken.balanceOf(addr1.address);
    expect(finalBalance).to.be.eq(startBalance.add(AMOUNT * 2));
  });
  it("should revert if redeem calls twice after once swap", async () => {
    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

    const signature = await getSignature(from, to, AMOUNT, ++nonce);
    await binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, nonce, signature);

    const tx = binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, nonce, signature);
    const reason = "Expired";
    await expect(tx).to.be.revertedWith(reason);
  });
  it("should revert if to is incorrect", async () => {
    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

    const signature = await getSignature(from, to, AMOUNT, ++nonce);

    const tx = binanceToken.redeem(to, from, AMOUNT, NETWORK_ID, nonce, signature);
    const reason = "Fail";
    await expect(tx).to.be.revertedWith(reason);
  });
  it("should revert if from is incorrect", async () => {
    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

    const signature = await getSignature(from, to, AMOUNT, ++nonce);

    const tx = binanceToken.redeem(to, to, AMOUNT, NETWORK_ID, nonce, signature);
    const reason = "Fail";
    await expect(tx).to.be.revertedWith(reason);
  });
  it("should revert if amount is incorrect", async () => {
    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

    const signature = await getSignature(from, to, AMOUNT, ++nonce);

    const tx = binanceToken.redeem(from, to, AMOUNT + 1, NETWORK_ID, nonce, signature);
    const reason = "Fail";
    await expect(tx).to.be.revertedWith(reason);
  });
  it("should revert if signature is incorrect", async () => {
    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

    const signature = await getSignature(from, to, AMOUNT + 555, ++nonce);

    const tx = binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, nonce, signature);
    const reason = "Fail";
    await expect(tx).to.be.revertedWith(reason);
  });
  it("should emit SwapInitialized event", async () => {
    const tx = rinkebyToken.swap(to, AMOUNT, NETWORK_ID);
    await expect(tx)
      .to.be.emit(rinkebyToken, "SwapInitialized")
      .withArgs(from, to, AMOUNT, NETWORK_ID, NETWORK_ID, ++nonce);
  });
  it("should emit Redeem event", async () => {
    await rinkebyToken.swap(to, AMOUNT, NETWORK_ID);

    const signature = await getSignature(from, to, AMOUNT, ++nonce);
    const tx = binanceToken.redeem(from, to, AMOUNT, NETWORK_ID, nonce, signature);
    await expect(tx)
      .to.be.emit(binanceToken, "Redeem")
      .withArgs(from, to, AMOUNT, NETWORK_ID, NETWORK_ID, nonce);
  });
});
