// const ganache = require("ganache");
const ethers = require("ethers");
const fs = require("fs");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );

  let accounts = await provider.listAccounts();
  let account = accounts[0];

  const signer = provider.getSigner(account);
  console.log("account: ", account);

  const pancakeSwapAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  const FLSTokenJSON = require("../bin/contracts/FlawlessToken.json");
  const FLSToken = new ethers.ContractFactory(
    FLSTokenJSON.abi,
    FLSTokenJSON.bytecode,
    signer
  );
  const flsToken = await FLSToken.deploy(
    "0xf9990ee3b102b64c21130b070fbc52aa860d4eb0"
  );
  await flsToken.deployed();

  let dbzTokenAddress = await flsToken.oldToken();

  return {
    flsTokenAddress: flsToken.address,
    dbzTokenAddress: dbzTokenAddress,
  };
}

main().then((result) => {
  let config = JSON.parse(
    fs.readFileSync("./config/development.config.json", (encoding = "utf-8"))
  );
  console.log(config);

  for (let entry of Object.entries(result)) {
    config[entry[0]] = entry[1];
  }

  fs.writeFile(
    "./config/development.config.json",
    JSON.stringify(config),
    (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    }
  );
});
