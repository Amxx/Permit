const { ethers } = require('hardhat');
const { expect } = require('chai');

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

const Permit20 = [
  { name: 'registry', type: 'address' },
  { name: 'to',       type: 'address' },
  { name: 'value',    type: 'uint256' },
  { name: 'nonce',    type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
];
const Permit721 = [
  { name: 'registry', type: 'address' },
  { name: 'tokenid',  type: 'uint256' },
  { name: 'to',       type: 'address' },
  { name: 'nonce',    type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
];
const Permit1155 = [
  { name: 'registry', type: 'address' },
  { name: 'tokenid',  type: 'uint256' },
  { name: 'to',       type: 'address' },
  { name: 'value',    type: 'uint256' },
  { name: 'nonce',    type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
  { name: 'data',     type: 'bytes'   },
]


const name    = 'MasterPermit';
const version = '1';

describe('Master', function () {
  before(async function() {
    const { chainId } = await ethers.provider.getNetwork();

    this.accounts  = await ethers.getSigners();
    this.relayer   = this.accounts.shift();
    this.holder    = this.accounts.shift();
    this.recipient = this.accounts.shift();
    this.erc20     = await deploy('ERC20Mock');
    this.erc721    = await deploy('ERC721Mock');
    this.erc1155   = await deploy('ERC1155Mock');
    this.master    = await deploy('PermitMaster', name);
    this.domain    = { name, version, chainId, verifyingContract: this.master.address };
  });

  describe('Operate on ERC20', function () {
    before(async function() {
      await this.erc20.mint(this.holder.address, ethers.utils.parseEther('100'));
      await this.erc20.connect(this.holder).approve(this.master.address, ethers.constants.MaxUint256);
    });

    it('transfer with permit', async function () {
      // prepare permit
      const data = {
        registry: this.erc20.address,
        to:       this.recipient.address,
        value:    ethers.utils.parseEther('1'),
        nonce:    await this.master.nonces(this.holder.address),
        deadline: ethers.constants.MaxUint256,
      }
      // sign permit
      const signature = await this.holder._signTypedData(this.domain, { Permit20 }, data);
      // execute permit
      await expect(this.master.connect(this.relayer).transfer20WithSign(
        data.registry,
        this.holder.address,
        data.to,
        data.value,
        data.deadline,
        signature
      )).to.emit(this.erc20, 'Transfer').withArgs(
        this.holder.address,
        data.to,
        data.value,
      );
    });
  });

  describe('Operate on ERC721', function () {
    before(async function() {
      await this.erc721.mint(this.holder.address, '42');
      await this.erc721.connect(this.holder).setApprovalForAll(this.master.address, true);
    });

    it('transfer with permit', async function () {
      // prepare permit
      const data = {
        registry: this.erc721.address,
        tokenid:  '42',
        to:       this.recipient.address,
        nonce:    await this.master.nonces(this.holder.address),
        deadline: ethers.constants.MaxUint256,
      }
      // sign permit
      const signature = await this.holder._signTypedData(this.domain, { Permit721 }, data);
      // execute permit
      await expect(this.master.connect(this.relayer).transfer721WithSign(
        data.registry,
        data.tokenid,
        data.to,
        data.deadline,
        signature
      )).to.emit(this.erc721, 'Transfer').withArgs(
        this.holder.address,
        data.to,
        data.tokenid,
      );
    });
  });

  describe('Operate on ERC1155', function () {
    before(async function() {
      await this.erc1155.mint(this.holder.address, '42', ethers.utils.parseEther('100'), '0x');
      await this.erc1155.connect(this.holder).setApprovalForAll(this.master.address, true);
    });

    it('transfer with permit', async function () {
      // prepare permit
      const data = {
        registry: this.erc1155.address,
        tokenid:  '42',
        to:       this.recipient.address,
        value:    ethers.utils.parseEther('1'),
        nonce:    await this.master.nonces(this.holder.address),
        deadline: ethers.constants.MaxUint256,
        data:     '0x',
      }
      // sign permit
      const signature = await this.holder._signTypedData(this.domain, { Permit1155 }, data);
      // execute permit
      await expect(this.master.connect(this.relayer).transfer1155WithSign(
        data.registry,
        data.tokenid,
        this.holder.address,
        data.to,
        data.value,
        data.deadline,
        data.data,
        signature,
      )).to.emit(this.erc1155, 'TransferSingle').withArgs(
        this.master.address,
        this.holder.address,
        this.recipient.address,
        data.tokenid,
        data.value,
      );
    });
  });
});
