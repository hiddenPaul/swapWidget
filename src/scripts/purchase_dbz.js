const ethers = require("ethers");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );

  let accounts = await provider.listAccounts();
  let account = accounts[0];

  const signer = provider.getSigner(account);
  console.log("account: ", account);

  const pancakeSwapAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const dbzAddress = "0x7a983559e130723B70e45bd637773DbDfD3F71Db";

  const swapABI = require("../bin/contracts/IUniswapV2Router02.json").abi;

  const swapContract = new ethers.Contract(pancakeSwapAddress, swapABI, signer);

  let WETHAddress = await swapContract.WETH();
  let minTokens = String(10 * (10 ** 18));
  let path = [WETHAddress, dbzAddress];
  let to = account;
  let deadline = Date.now() + 10 * 1000;

  return await swapContract.swapExactETHForTokensSupportingFeeOnTransferTokens(
    minTokens,
    path,
    to,
    deadline,
    { value: String(10 * (10 ** 18)) }
  );
}

main()
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.log(error);
  });
