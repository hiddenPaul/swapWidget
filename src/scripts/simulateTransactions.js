const ethers = require("ethers");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );

  let accounts = await provider.listAccounts();
  let account = accounts[0];

  const signer = provider.getSigner(account);
  console.log("account: ", account);
  const flsAddress = require("../dev.config.json").flsTokenAddress;
  const flsABI = require("../bin/contracts/FlawlessToken.json").abi;
  const flsContract = new ethers.Contract(flsAddress, flsABI, signer);

  for (let i = 0; i < 10; i++) {
    await flsContract.transfer(
      "0x93e2985631ee2d3ed9737862ba4cf9d34504522d",
      1000
    );
    console.log(i);
  }
}

main()
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.log(error);
  });
