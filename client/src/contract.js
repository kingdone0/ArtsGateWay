import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

import ArtWayNFTABI from "./ArtWayNFT.json";

export const getContract = async () => {
  if (!window.ethereum) throw new Error("Metamask not installed");

  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ArtWayNFTABI.abi, signer);
  return contract;
};