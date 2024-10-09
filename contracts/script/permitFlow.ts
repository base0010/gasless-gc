import { ethers, TypedDataEncoder} from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { signERC2612Permit } from 'eth-permit';
import { Contract, Wallet } from 'ethers';

dotenv.config({ path: __dirname + '../.env' });
//Env vars
const USER_PRIVATE_KEY = process.env.USER_PRIVATE_KEY!;
const RPC_PROVIDER = process.env.RPC_PROVIDER!;
const CHAIN_ID = process.env.CHAIN_ID!;

//Deployed Addresses & Constants
const ECR20PERMIT_ADDRESS = process.env.ECR20PERMIT_ADDRESS!;
const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS!;


const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
const wallet = new ethers.Wallet(USER_PRIVATE_KEY, provider);


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

const relayer = new ethers.Contract(RELAYER_ADDRESS!, relayerABI, wallet);



async function setup() {
  console.log(ECR20PERMIT_ADDRESS, RELAYER_ADDRESS)
  if (!ECR20PERMIT_ADDRESS || !RELAYER_ADDRESS) {
    throw new Error('Please set Token and Relayer Address in your .env file');
  }

  //todo: dosen't check if the address is already deployed
  if (!USER_PRIVATE_KEY || !RPC_PROVIDER) {
    throw new Error(
      'Please set your USER_PRIVATE_KEY and RPC_PROVIDER in a .env file'
    );
  }

}
const value = 1;
// const nonce_owner = await recieverInstance.nonces(owner);
const nonce_owner = 0;
const deadline = 9999999999;
let spender = wallet.address;

async function create712SigForPermit(): Promise<string> {
  console.log('Creating 712 Sig for Permit');

  const token = new ethers.Contract(ECR20PERMIT_ADDRESS!, erc20PermitABI, wallet);



  const owner = wallet.address;
  // const spender = await relayer.getAddress()!;


  const domain = {
    name: await token.name(),
    version: "1",
    chainId: CHAIN_ID,
    verifyingContract: ECR20PERMIT_ADDRESS
  }

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  const values = {
    owner: wallet.address,
    spender: spender,
    value: value,
    nonce: nonce_owner,
    deadline: deadline
  }

  // currently signer is sender
  // const erc712Sig = await wallet.signMessage(msgParams);
  console.log(`tvd`, {types, values, domain})
  const erc712Sig = await wallet.signTypedData(domain, types, values);

  console.log('Signature:', erc712Sig);

  //verify the signature
  const recovered = ethers.verifyTypedData(
    domain,
    types,
    values,
    erc712Sig
  );

  console.log(`Typed data hash for 712`, TypedDataEncoder.hash(domain, types, values))

  console.log('Recovered 712 Address:', recovered);
  console.log('Signer Address matches recovered address:', (wallet.address == recovered));

  return erc712Sig;


}

function manipulateSignatureForPermitCall(erc712Sig: string): { r: string, s: string, v: number } {

  const signature = erc712Sig.substring(2);
  const r = "0x" + signature.substring(0, 64);
  const s = "0x" + signature.substring(64, 128);
  const v = parseInt(signature.substring(128, 130), 16);
  console.log("r:", r);
  console.log("s:", s);
  console.log("v:", v);

  return { r, s, v };

}



async function main() {

  const envSetup = await setup()

  const user721Sig = await create712SigForPermit();

  const { r, s, v } = manipulateSignatureForPermitCall(user721Sig);

  // console.log(r, s, v)
  const recieverInstance = new ethers.Contract(RELAYER_ADDRESS!, relayerABI, wallet);
  const tokenInstance = new ethers.Contract(ECR20PERMIT_ADDRESS!, erc20PermitABI, wallet);

  //this works only for approve
  const res = await tokenInstance.callTransfer(wallet.address, spender, value, deadline, v, r, s);
  
  //ideally this needs to work, probably a problem with the abi encoding
  //const res = await recieverInstance.callPermit([ECR20PERMIT_ADDRESS], [wallet.address], [value], [deadline], [v], [r], [s], [spender]);


  console.log(res);
  console.log([ECR20PERMIT_ADDRESS!], [wallet.address], [value], [nonce_owner], [deadline], [r], [s], [wallet.address]);
}

main().catch((error) => {
  console.error('Error calling contracts:', error);
});
