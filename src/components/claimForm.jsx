import styles from "../styles/Migrate.module.css";
import { Box, Button, Typography, Stack, Paper, Divider, Grid, Container } from "@mui/material";
import TokenDisplay from "./tokenDisplay";
import CircularProgress from '@mui/material/CircularProgress';

import React, { useEffect } from "react";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import detectEthereumProvider from '@metamask/detect-provider';
import { isMetaMaskConnected } from '../utils/metamask';
import { ethers } from "ethers";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";



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
    const flsJSON = require("../bin/contracts/FlawlessToken.json");
    const distributorJSON = require("../bin/contracts/DividendDistributor.json");

    const flsContract = new ethers.Contract(config.flsTokenAddress, flsJSON.abi, signer);
    // Get dividends amount
    let distributorAddress = await flsContract.distributorAddress();
    const distributorContract = new ethers.Contract(distributorAddress, distributorJSON.abi, signer);

    return {
        flsContract,
        distributorContract,
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

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Get BNB balance
    let bnbBalance = await provider.getBalance(contracts.account);

    // Get distribution amount
    let dividendAmount = await contracts.distributorContract.getUnpaidEarnings(contracts.account);

    return {
        BNB: bnbBalance,
        dividends: dividendAmount
    };
}

const TransactionInProgress = () => {
    return (
        <Box sx={{ justifyContent: 'center', textAlign: 'center' }}>
            Transaction in progress <CircularProgress size={"1.2rem"} color="inherit" />
        </Box>
    );
}


const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function ClaimForm() {
    const [balances, setBalances] = React.useState({ old: "", new: "" });
    const [contracts, setContracts] = React.useState({ account: "0x0000000000000000000000000000000000000000" });
    const [transactionInProgress, setTransactionInProgress] = React.useState(false);
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

    const handleClaim = async () => {
        setTransactionInProgress(true);
        try {
            let tx = null;
            tx = await contracts.distributorContract.claimDividend();
            await tx.wait(); // Wait for transaction to be mined
            let balances = await getBalances(contracts);
            setBalances(balances);
            handleSnackbarOpen("Transaction successful", "success", 6000);
        } catch (e) {
            console.log(e);
            handleSnackbarOpen("Transaction failed", "error", 6000);
        }
        setTransactionInProgress(false);
    };

    return (
        <>
            <Container maxWidth='sm'>
                <Stack className={styles.stack} sx={{ fontFamily: "Play" }}>
                    <Paper elevation={24}>
                        <Box container className={styles.innerStack}>
                            <Box container className={styles.stackItem}>
                                <Typography variant="h2" sx={{ fontFamily: "Play" }}>
                                    Claim Dividends
                                </Typography>
                                <Divider />
                                <Typography sx={{ letterSpacing: .5, textOverflow: "ellipsis", overflow: 'hidden', fontFamily: "Play" }}>
                                    {contracts ? contracts.account : "No Wallet Connected"}
                                </Typography>
                                <TokenDisplay token="BNB Available" balance={balances ? (balances.dividends / (10 ** 18)) : null} />
                                <Box container>
                                    <Grid container>
                                        <Grid item xs={2} s={2} xl={2}></Grid>
                                        <Grid item xs={10} s={10} xl={10}>
                                            <ArrowDownwardIcon />
                                        </Grid>
                                    </Grid>
                                </Box>
                                <TokenDisplay token="Current BNB In Wallet" balance={balances ? (balances.BNB / (10 ** 18)) : null} />
                                <Box className={styles.stackItem} sx={{ marginBottom: '1rem' }}></Box>

                                <Button variant="contained" onClick={handleClaim} sx={{ width: "100%", fontFamily: "Play" }} disabled={transactionInProgress} >
                                    {transactionInProgress ? <CircularProgress size={25} /> : "Claim Dividends"}
                                </Button>


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