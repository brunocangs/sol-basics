import { expect } from "chai";
import { ethers } from "hardhat";
import * as BasicsJson from "../artifacts/contracts/Basics.sol/Basics.json";

const MNEMONIC =
  "fire grant pencil conduct ramp often jungle wheel omit unfair melt skate";

describe("Basics", () => {
  describe("Wallets", async () => {
    // Chegar em 0xeADEc6CFA6992c847652A1D72FA4251E0F2DDFde
    it("Creates from a mnemonic", async () => {
      const node = ethers.utils.HDNode.fromMnemonic(MNEMONIC);
      expect(node.address).to.exist;
    });
    it("Derives default path address to match MetaMask", async () => {
      const node = ethers.utils.HDNode.fromMnemonic(MNEMONIC);
      const child = node.derivePath(ethers.utils.defaultPath);
      expect(child.address).to.eq("0xeADEc6CFA6992c847652A1D72FA4251E0F2DDFde");
    });
    it("Derives other paths", async () => {
      const node = ethers.utils.HDNode.fromMnemonic(MNEMONIC);
      const child = node.derivePath(
        ethers.utils.defaultPath.slice(0, -1) + "1"
      );
      expect(child.address).to.eq("0x15111F1983904C3DEd5d210c36750882995D960F");
    });
    it("Creates from a private key", async () => {
      const node = ethers.utils.HDNode.fromMnemonic(MNEMONIC);
      const child = node.derivePath(
        ethers.utils.defaultPath.slice(0, -1) + "2"
      );
      expect(child.privateKey).to.exist;
    });
    it("Creates using Hardhat mnemonic", async () => {
      const HardhatMnemonic = Array.from({ length: 11 }, () => "test")
        .concat("junk")
        .join(" ");
      const wallet = ethers.Wallet.fromMnemonic(HardhatMnemonic);
      const [first] = await ethers.getSigners();
      expect(wallet.address).to.eq(first.address);
    });
    it("Signs a transaction", async () => {
      const wallet = ethers.Wallet.fromMnemonic(MNEMONIC);
      const [first] = await ethers.getSigners();

      const signedTx = await wallet.signTransaction({
        to: first.address,
        value: ethers.BigNumber.from("100000000"),
      });
      const parsed = await ethers.utils.parseTransaction(signedTx);
      expect(parsed.from).to.eq(wallet.address);
    });
    it("Fails to submit a signed transaction when missing provider", async () => {
      const [first] = await ethers.getSigners();
      const wallet = ethers.Wallet.fromMnemonic(MNEMONIC);
      const populated = await wallet
        .connect(first.provider!)
        .populateTransaction({
          to: first.address,
          value: ethers.BigNumber.from("100000000"),
        });
      const signed = await wallet.signTransaction(populated);
      try {
        await wallet.provider.sendTransaction(signed);
      } catch (err) {
        expect(err).to.exist;
        return;
      }
      expect(false).to.be.true;
    });
    it("Successfully submits a signed transaction when connected to a provider", async () => {
      const [first] = await ethers.getSigners();
      const wallet = ethers.Wallet.fromMnemonic(MNEMONIC).connect(
        first.provider!
      );
      await first.sendTransaction({
        to: wallet.address,
        value: ethers.BigNumber.from(10).pow(18),
      });
      const tx = await wallet.sendTransaction({
        to: first.address,
        value: 0,
      });
      expect(tx.hash).to.exist;
    });
  });
  describe("Contracts", async () => {
    it("Deploys a contract by submitting bytecode directly", async () => {
      const [first] = await ethers.getSigners();
      await first.sendTransaction({
        data: BasicsJson.bytecode,
      });
    });
    it("Uses etherjs contract to execute above", async () => {
      const [first] = await ethers.getSigners();

      const Basics = await ethers.getContractFactory("Basics");
      const basics = await Basics.deploy();
      await basics.deployed();

      const BasicsAsFirst = basics.connect(first);
      const valor = await BasicsAsFirst.get();
    });
    it("Executes set as First", async () => {
      const [first] = await ethers.getSigners();

      const Basics = await ethers.getContractFactory("Basics");
      const basics = await Basics.deploy();
      await basics.deployed();

      const BasicsAsFirst = basics.connect(first);
      const valorAntes = await BasicsAsFirst.get();

      const tx = await BasicsAsFirst.set(25);
      await tx.wait();

      const valorDepois = await BasicsAsFirst.get();
      expect(valorAntes).is.not.eq(valorDepois);
      expect(valorDepois).is.eq(25);
    });
  });
});
