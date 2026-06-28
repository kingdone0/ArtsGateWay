import { ethers } from "ethers";
import ArtWayNFTArtifact from "../../../blockchain/artifacts/contracts/ArtWayNFT.sol/ArtWayNFT.json"; 

const CONTRACT_ADDRESS = "0x7019d3Cc0a363c30d0D31bF55cC6351c78f09A50"; 

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = provider.getSigner(0);

export const artWayContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  ArtWayNFTArtifact.abi,
  signer
);

export const mintNFT = async () => {
  const tx = await artWayContract.mint(await signer.getAddress());
  await tx.wait();
  console.log("Minted NFT:", tx);
  return tx;
};