import React, { useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { isMetaMaskConnected } from '../utils/metamask';
import { Box, Button, Typography, Stack, Paper, Divider, Grid, Container } from "@mui/material";
import styles from "../styles/Migrate.module.css";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CircularProgress from '@mui/material/CircularProgress';
import { ethers } from "ethers";
import detectEthereumProvider from '@metamask/detect-provider';
import WatchTokenButton from "./watchTokenButton";
import TokenDisplay from "./tokenDisplay";



async function setupContracts() {
    if (typeof window.ethereum === null) {
        console.log("No provider")
        return;
    }

    let connected = await isMetaMaskConnected();
    if (!connected) {
        return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    let accounts = await provider.listAccounts();
    const signer = provider.getSigner(accounts[0]);
    const config = require(`../config/${process.env.NODE_ENV}.config.json`);
    const dbzJSON = require("../bin/contracts/DiamondBoyzCoin.json");
    const flsJSON = require("../bin/contracts/FlawlessToken.json");

    const flsContract = new ethers.Contract(config.flsTokenAddress, flsJSON.abi, signer);

    let dbzAddress = await flsContract.oldCLR();

    const dbzContract = new ethers.Contract(dbzAddress, dbzJSON.abi, signer);

    const flsDecimals = await flsContract.decimals();
    const dbzDecimals = await dbzContract.decimals();

    return {
        flsContract,
        dbzContract,
        flsDecimals,
        dbzDecimals,
        signer,
        account: accounts[0],
    };
}

async function getBalances(contracts) {
    let connected = await isMetaMaskConnected();
    if (!connected) {
        return;
    }

    if (!contracts) {
        console.log("Contracts not loaded");
        return;
    }

    let flsBalance = await contracts.flsContract.balanceOf(contracts.account);
    let dbzBalance = await contracts.dbzContract.balanceOf(contracts.account);

    return {
        old: dbzBalance.toString(),
        new: flsBalance.toString(),
    };
}


const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


const TransactionInProgress = () => {
    return (
        <Box sx={{ justifyContent: 'center', textAlign: 'center' }}>
            Transaction in progress <CircularProgress size={"1.2rem"} color="inherit" />
        </Box>
    );
}

export default function MigrationForm() {
    const [balances, setBalances] = React.useState({ old: "", new: "" });
    const [contracts, setContracts] = React.useState({ account: "0x0000000000000000000000000000000000000000" });
    // const [migrationAmount, setMigrationAmount] = React.useState("");
    const [migrationInProgress, setMigrationInProgress] = React.useState(false);

    const [snackbarState, setSnackbarState] = React.useState({
        open: false,
        message: <TransactionInProgress />,
        severity: "info",
        autoHideDuration: null,
    });

    useEffect(() => {
        const config = require(`../config/${process.env.NODE_ENV}.config.json`);
        detectEthereumProvider().then((eth) => {
            eth.on("accountsChanged", () => {
                setupContracts().then((contracts) => {
                    setContracts(contracts);
                    getBalances(contracts).then((balances) => {
                        setBalances(balances);
                    });
                });
            });

            isMetaMaskConnected().then((connected) => {
                if (!connected) {
                    return;
                }

                if (eth.chainId !== config.chainId) {
                    return;
                }

                setupContracts().then((contracts) => {
                    setContracts(contracts);
                    getBalances(contracts).then((balances) => {
                        setBalances(balances);
                    });
                });
            });
        });

    }, []);

    const handleSnackbarOpen = (message, severity, duration) => {
        setSnackbarState({
            open: true,
            message,
            severity,
            autoHideDuration: duration,
        });
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setSnackbarState({
            open: false,
        });
    };

    const handleMigrate = async () => {
        setMigrationInProgress(true);

        let amount = balances.old;

        if (!contracts) {
            return;
        }

        try {
            let tx = null;

            // Check is dbz allowance is high enough
            let dbzAllowance = await contracts.dbzContract.allowance(contracts.account, contracts.flsContract.address);

            if (parseInt(dbzAllowance.toString()) < amount) {
                tx = await contracts.dbzContract.approve(
                    contracts.flsContract.address,
                    amount
                );
                await tx.wait();
            }

            tx = await contracts.flsContract.migrate(amount,
                {
                    gasLimit: ethers.BigNumber.from("15000000"),
                }
            );
            await tx.wait(); // Wait for transaction to be mined
            let balances = await getBalances(contracts)
            setBalances(balances);
            handleSnackbarOpen("Transaction successful", "success", 6000);
        } catch (error) {
            console.log(error);
            handleSnackbarOpen("Transaction failed", "error", null);
        }
        setMigrationInProgress(false);
    };

    return (
        <>
            <Container maxWidth='sm'>
                <Stack className={styles.stack} sx={{ fontFamily: "Play" }}>
                    <Paper elevation={24}>
                        <Box container className={styles.innerStack}>
                            <Box container className={styles.stackItem}>
                                <Typography variant="h2" sx={{ fontFamily: "Play" }}>
                                    Migrate
                                </Typography>
                                <Divider />
                                <Typography sx={{ letterSpacing: .5, textOverflow: "ellipsis", overflow: 'hidden', fontFamily: "Play" }}>
                                    {contracts ? contracts.account : "No Wallet Connected"}
                                </Typography>
                            </Box>
                            <TokenDisplay token="DBZ" balance={balances ? (balances.old / (10 ** 18)) : null} />
                            <Box container>
                                <Grid container>
                                    <Grid item xs={2} s={2} xl={2}></Grid>
                                    <Grid item xs={10} s={10} xl={10}>
                                        <ArrowDownwardIcon />
                                    </Grid>
                                </Grid>
                            </Box>
                            <TokenDisplay token="FLS" balance={balances ? (balances.new / (10 ** 18)) : null} />

                            <Box className={styles.stackItem} sx={{ marginBottom: '1rem' }}>
                            </Box>
                            <Button variant="contained" onClick={handleMigrate} sx={{ width: "100%", fontFamily: "Play" }} disabled={migrationInProgress} >
                                {migrationInProgress ? <CircularProgress size={25} /> : "Migrate"}
                            </Button>
                            <Box sx={{ marginTop: 1, width: "100%" }}>
                                <WatchTokenButton tokenSymbol={"FLS"} />
                            </Box>
                        </Box>
                    </Paper>
                </Stack>
            </Container>

            <Snackbar open={snackbarState.open} autoHideDuration={snackbarState.autoHideDuration} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={handleSnackbarClose} severity={snackbarState.severity}>
                    <Box>
                        {snackbarState.message}
                    </Box>
                </Alert>
            </Snackbar>
        </>
    )
}