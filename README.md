## Dev Startup procedure

1. start running the ganache CLI which is forked from the mainnet archive node

```
. ./start_ganache.sh
```

Find the first account private key and import the account into metamask

2. Deploy contracts

In a new terminal Run this command to deploy the contracts to the ganache test chain
```
node scripts/deploy_contracts.js
```

3. Purchase DBZ Coin from the router
```
node scripts/purchase_dbz.js
```

4. Start the webserver
```
npm run dev
```

The metamask connect button is on the home page atm if needed. Should probably have a modal that pops up if it isn't connected though. 