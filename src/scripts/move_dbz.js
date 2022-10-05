const ethers = require("ethers");

async function main() {
  const config = require("../config.json");
  const addresses = require("../testnet.config.json");
  const dbzJSON = require("../bin/contracts/DiamondBoyzCoin.json");

  const provider = new ethers.providers.JsonRpcProvider(config.bscTestnetRPC);

  const signer = new ethers.Wallet(config.bscTestnetPrivateKey, provider);

  const dbzContract = new ethers.Contract(addresses.dbzTokenAddress, dbzJSON.abi, signer);

  const wallet = new ethers.Wallet(config.bscTestnetPrivateKey2);

  let tx = await dbzContract.transfer(wallet.address, String(10 * (10 ** 18)));
  console.log(tx);
  await tx.wait();
  console.log("done");
}

main()
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.log(error);
  });
