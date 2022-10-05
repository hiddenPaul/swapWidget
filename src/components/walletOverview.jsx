import styles from "../styles/Migrate.module.css";
import { Box, Button, Typography, Stack, Paper, Divider, Grid, Container, alpha } from "@mui/material";
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

    // Get FLS balance
    let flsBalance = await contracts.flsContract.balanceOf(contracts.account);

    // Get distribution amount
    let dividendAmount = await contracts.distributorContract.getUnpaidEarnings(contracts.account);

    return {
        BNB: bnbBalance,
        FLS: flsBalance,
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
            <Container sx={{ my: 2, textOverflow: 'ellipsis' }}>
                <Stack spacing={2} direction="row" sx={{ fontFamily: "Play", width: '100%' }}>
                    <Paper elevation={3} sx={{ width: '100%', bgcolor:alpha('#002A3C', 0.5) }}>
                        <Typography variant="h3" sx={{ fontFamily: "Play", textAlign: 'center', color: 'white' }}>
                            Wallet Overview
                        </Typography>
                        <TokenDisplay token="Wallet" balance={contracts ? contracts.account : "No Wallet Connected"} />
                        <TokenDisplay token="FLS Balance" balance={balances ? (balances.FLS / (10 ** 18)) : null} />
                        <TokenDisplay token="BNB Balance" balance={balances ? (balances.BNB / (10 ** 18)) : null} />
                        <TokenDisplay token="Rewards Available (BNB)" balance={balances ? (balances.dividends / (10 ** 18)) : null} />
                        <Box className={styles.stackItem} sx={{ marginBottom: '1rem' }}></Box>
                        <Button variant="contained" href="https://discord.com/channels/924006988780797963/947993214802083840" target="_blank" rel="noopener,noreferrer" sx={{ width: "100%", fontFamily: "Play", mb: 1, bgcolor:"#32667D" }}>
                            Voting
                        </Button>
                        <Button variant="contained" onClick={handleClaim} sx={{ width: "100%", fontFamily: "Play", bgcolor:"#32667D"}} disabled={transactionInProgress} >
                            {transactionInProgress ? <CircularProgress size={25} /> : "Claim Rewards"}
                        </Button>
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