const ethers = require("ethers");
const fs = require("fs");

async function main() {
  const config = require("../config/config.json");
  const dbzJSON = require("../bin/contracts/DiamondBoyzCoin.json");
  const flsJSON = require("../bin/contracts/FlawlessToken.json");

  const provider = new ethers.providers.JsonRpcProvider(
    config.bscTestnetRPC
  );
  const signer = new ethers.Wallet(config.bscTestnetPrivateKey, provider);

  const dbzFactory = new ethers.ContractFactory(
    dbzJSON.abi,
    dbzJSON.bytecode,
    signer
  );

  const flsFactory = new ethers.ContractFactory(
    flsJSON.abi,
    flsJSON.bytecode,
    signer
  );

  console.log("Deploying DiamondBoyzCoin...");
  let dbzContract = await dbzFactory.deploy(config.pancakeSwapTestnetAddress);
  await dbzContract.deployed();
  
  console.log("Deploying FlawlessToken...");
  let flsContract = await flsFactory.deploy(
    dbzContract.address,
    config.pancakeSwapTestnetAddress,
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
    "0xf9990ee3b102b64c21130b070fbc52aa860d4eb0" // MigrationBank
  );
  await flsContract.deployed();

  return {
    dbzTokenAddress: dbzContract.address,
    flsTokenAddress: flsContract.address
  }
}

main().then((result) => {
  fs.writeFile("./testnet.config.json", JSON.stringify(result), (err) => {
    if (err) throw err;
    console.log("The file has been saved!");
  });
}).catch((err) => {
    fs.writeFile("./error.json", JSON.stringify(err), (e) => {
        if (e) throw e;
        console.log("Error Occured! check error.json");
      });    
});
