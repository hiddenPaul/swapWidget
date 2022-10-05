const ethers = require("ethers");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );
  let accounts = await provider.listAccounts();
  let account = accounts[0];

  const signer = provider.getSigner(account);
  const signer1 = provider.getSigner(accounts[1]);
  const signer2 = provider.getSigner(accounts[2]);

  const flsABI = require("../bin/contracts/FlawlessToken.json").abi;
  const flsAddress =
    require("../config/development.config.json").flsTokenAddress;
  const routerABI = require("../bin/contracts/IUniswapV2Router02.json").abi;
  const WBNBABI = require("../bin/interfaces/IBEP20.json").abi;

  const fls = new ethers.Contract(flsAddress, flsABI, signer);
  const routerAddress = await fls.dexRouter();

  const router = new ethers.Contract(routerAddress, routerABI, signer);

  const WBNBAddress = await fls.WBNB();

  const wbnb = new ethers.Contract(WBNBAddress, WBNBABI, signer);

  const amount = ethers.utils.parseEther("10");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  await fls.approve(routerAddress, amount);
  await wbnb.approve(routerAddress, amount);

  await fls.adminMint(accounts[0], ethers.utils.parseEther("10.1"));

  // transfer amount to WBNB
  let tx = {
    to: WBNBAddress,
    value: amount,
  };

  await signer.sendTransaction(tx);

  // add liquidity
  console.log("adding liquidity");
  await router.addLiquidity(
    WBNBAddress,
    flsAddress,
    amount,
    amount,
    0,
    0,
    account,
    deadline
  );
  console.log("liquidity added");
}

main();
