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

    const amount = ethers.utils.parseEther("10");

    const fls = new ethers.Contract(flsAddress, flsABI, signer);

    const fls1 = new ethers.Contract(flsAddress, flsABI, signer1);
    const fls2 = new ethers.Contract(flsAddress, flsABI, signer2);
    // Generate dividends
    await fls.adminMint(accounts[1], amount);

    // account 3 should have dividends
    await fls.adminMint(accounts[0], amount);
    await fls.transfer(accounts[3], amount);

    // Mint tokens to the contract in order to force a swap
    await fls.adminMint(fls.address, fls.swapThreshold());

    // Tranfer from account 1 to account 2
    await fls1.transfer(accounts[2], await fls.balanceOf(accounts[1]));

    await fls2.transfer(accounts[1], fls.balanceOf(accounts[2]));

    // check dividends

    distributorAddress = await fls.distributorAddress();
    distributorABI = require("../bin/contracts/DividendDistributor.json").abi;
    distributor = new ethers.Contract(distributorAddress, distributorABI, signer);

    console.log(
        "dividends for 3: ",
        (await distributor.getUnpaidEarnings(accounts[3])).toString()
    );
}
main()
    .then((result) => {
        console.log(result);
    })
    .catch((error) => {
        console.log(error);
    });
