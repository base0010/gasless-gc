import { ethers, parseUnits } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { setEnvValue } from './utils/misc';

const env = dotenv.config();

//Env Vars
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY!;
const RPC_PROVIDER = process.env.RPC_PROVIDER!;

let RELAYER_ADDRESS = process.env.RELAYER_ADDRESS!;
let ECR20PERMIT_ADDRESS = process.env.ECR20PERMIT_ADDRESS!;

const INIT_SUPPLY = parseUnits('100000', 18);

//todo: dosen't check if the address is already deployed
if (!OWNER_PRIVATE_KEY || !RPC_PROVIDER) {
  throw new Error(
    'Please set your OWNER_PRIVATE_KEY and RPC_PROVIDER in a .env file'
  );
}

const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);


const erc20PermitArtifactPath = path.join(
  __dirname,
  '../artifacts/contracts/Token.sol/Token.json'
);

const relayerArtifactPath = path.join(
  __dirname,
  "../artifacts/contracts/Reciever.sol/Receiver.json"
);

//Relayer Deps
const relayerArtifact = JSON.parse(fs.readFileSync(relayerArtifactPath, 'utf8'));
const relayerABI = relayerArtifact.abi;
const relayerBytecode = relayerArtifact.bytecode;

//Token Deps
const erc20PermitArtifact = JSON.parse(fs.readFileSync(erc20PermitArtifactPath, 'utf8'));
const erc20PermitABI = erc20PermitArtifact.abi;
const erc20PermitBytecode = erc20PermitArtifact.bytecode;


async function deployRelayer(): Promise<string> {
  if(!RELAYER_ADDRESS) {
  console.log('Deploying Reciever contract...');
  const factory = new ethers.ContractFactory(relayerABI, relayerBytecode, wallet);

  const contract = await factory.deploy();
  const address = await contract.getAddress();

  console.log('Reciever contract deployed at address:', address);
  const deploymentTransaction = contract.deploymentTransaction();
  console.log('Transaction hash:', deploymentTransaction!.hash);

  await contract.waitForDeployment();

    console.log('Reciever contract successfully deployed and confirmed!');
    return address;
  }else{
    return RELAYER_ADDRESS;
  }

}

async function deployTesterc20Permit(initSupply: bigint, relayerAddress: string): Promise<string> {
  console.log('Deploying Test Token contract...');

  const factory = new ethers.ContractFactory(erc20PermitABI, erc20PermitBytecode, wallet);
  const contract = await factory.deploy(initSupply, relayerAddress);

  const address = await contract.getAddress();
  console.log('Testerc20Permit deployed at address:', address);
  const deploymentTransaction = contract.deploymentTransaction();
  console.log('Transaction hash:', deploymentTransaction!.hash);

  await contract.waitForDeployment();

  console.log('Testerc20Permit contract successfully deployed and confirmed!');
  return address;
}


async function main() {

  if (!RELAYER_ADDRESS) {
    RELAYER_ADDRESS = await deployRelayer();
    setEnvValue('RELAYER_ADDRESS', RELAYER_ADDRESS);
  }

  if (!ECR20PERMIT_ADDRESS) {
    ECR20PERMIT_ADDRESS = await deployTesterc20Permit(INIT_SUPPLY, RELAYER_ADDRESS);
    setEnvValue('ECR20PERMIT_ADDRESS', ECR20PERMIT_ADDRESS);
  }

}

main().catch((error) => {
  console.error('Error deploying contracts:', error);
});
