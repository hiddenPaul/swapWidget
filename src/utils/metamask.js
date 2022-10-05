import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import MetaMaskOnboarding from '@metamask/onboarding';


const isMetaMaskConnected = async () => {
  let eth = await detectEthereumProvider();
  const provider = new ethers.providers.Web3Provider(eth);
  const accounts = await provider.listAccounts();
  return accounts.length > 0;
};

async function connectToMetamask() {

  const onboarding = new MetaMaskOnboarding();

  if (MetaMaskOnboarding.isMetaMaskInstalled()) {
    let eth = await detectEthereumProvider();
    return await eth.request({ method: "eth_requestAccounts" });
  } else {
    onboarding.startOnboarding();
  }

}

async function watchToken(tokenInfo) {
  let eth = await detectEthereumProvider();
  try {
    await eth.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: tokenInfo,
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function switchMetaMaskNetwork() {
  let eth = await detectEthereumProvider();
  const config = require(`../config/${process.env.NODE_ENV}.config.json`);
  try {
    let res = await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.chainId }],
    });
    window.location.reload(); // reloading to switch networks on page
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    console.log("Caught", switchError);
    if (switchError.code === 4902) {
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: config.chainId,
              chainName: config.chainName,
              rpcUrls: [config.rpcURL],
            },
          ],
        });
        window.location.reload();  // reloading to switch networks on page
        return true;
      } catch (addError) {
        console.log(addError);
      }
    }
  }
  return false;
}

async function onboard() {
  const onboarding = new MetaMaskOnboarding();
  onboarding.startOnboarding();

}

export { isMetaMaskConnected, connectToMetamask, switchMetaMaskNetwork, watchToken, onboard };
