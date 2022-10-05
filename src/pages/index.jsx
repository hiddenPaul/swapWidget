import Head from 'next/head'
import Navbar from '../components/navbar'
import { Box, Paper, Stack, Container, Typography } from '@mui/material'
import MetamaskModal from '../components/metamaskModal';
import MigrationForm from '../components/migrateForm';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TokenDisplay from '../components/tokenDisplay';
import React, { useEffect } from 'react'
import { isMobile } from 'react-device-detect';
import { connectToMetamask, isMetaMaskConnected, switchMetaMaskNetwork } from "../utils/metamask";
import detectEthereumProvider from '@metamask/detect-provider';
import WalletOverview from '../components/walletOverview';


export default function Home() {
    const [isMetamaskConnectedModalOpen, setIsMetamaskConnectedModalOpen] = React.useState(false);
    const [isMetamaskSwitchNetworkModalOpen, setIsMetamaskSwitchNetworkModalOpen] = React.useState(false);
    const [provider, setProvider] = React.useState(null);

    const config = require(`../config/${process.env.NODE_ENV}.config.json`);
    let switchIntervalId;

    useEffect(() => {
        // Check if MetaMask is connected
        detectEthereumProvider({ mustBeMetaMask: true }).then(eth => {

            eth.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    metamaskConnectedModalOpen();
                }
            });

            if (!eth) {
                metamaskConnectedModalOpen();
            } else {

                isMetaMaskConnected().then(connected => {
                    if (!connected) {
                        metamaskConnectedModalOpen()
                    }
                });
                setProvider(eth);
            }
        })
    }, [])

    useEffect(() => {

        if (!provider) {
            return;
        }

        console.log("chainId", provider?.chainId);

        if (provider?.chainId === null || provider?.chainId === '0x1') {
            metamaskSwitchModalClose(); // close if null to prevent it from appearing if it loads later. 

            // setup interval to find when the window.ethereum.chainId updates to an actual value that way we can check if the user is on the right chain
            switchIntervalId = setInterval(() => {
                if (provider.chainId === null) {
                    return;
                } else if (provider?.chainId !== config.chainId) {
                    metamaskSwitchModalOpen();
                    clearInterval(switchIntervalId);
                } else {
                    clearInterval(switchIntervalId);
                }
            }, 100)

        } else if (provider.chainId !== config.chainId) {
            metamaskSwitchModalOpen();
        }
    }, [provider])

    const metamaskConnectedModalClose = (event, reason) => {
        if (reason && reason === 'backdropClick') {
            return;
        }
        setIsMetamaskConnectedModalOpen(false);
    }

    const metamaskConnectedModalOpen = () => {
        setIsMetamaskConnectedModalOpen(true);
    }

    const metamaskSwitchModalClose = (event, reason) => {
        if (reason && reason === 'backdropClick') {
            return;
        }

        if (provider?.chainId === config.chainId) {
            setIsMetamaskSwitchNetworkModalOpen(false);
        }
        // setIsMetamaskSwitchNetworkModalOpen(false);
    }

    const metamaskSwitchModalOpen = () => {
        setIsMetamaskSwitchNetworkModalOpen(true);
    }

    return (
        <>
            <Head>
                <title>FLS Portal</title>
                <link rel="icon" href="../public/favicon.ico" />
            </Head>
            <Navbar />
            <Container maxWidth='md' sx={{ width: '100%', mx: 'auto' }}>
                <WalletOverview />
            </Container>
            <MetamaskModal
                open={isMetamaskConnectedModalOpen}
                handleClose={metamaskConnectedModalClose}
                func={(isMobile && !provider) ? () => { window.open("https://metamask.app.link/dapp/nameless-sunset-5779.on.fleek.co", '_blank'); } : connectToMetamask}
                text={"Please connect to MetaMask!"}
                linkText = "Don't have MetaMask? Click here!"
                linkURL = "https://metamask.zendesk.com/hc/en-us/articles/360015489531"
                buttonText={(isMobile && !provider) ? "Open in the MetaMask App!" : "Connect"}
            />
            <MetamaskModal
                open={isMetamaskSwitchNetworkModalOpen}
                handleClose={metamaskSwitchModalClose}
                func={isMobile ? () => { window.open("https://docs.pancakeswap.finance/get-started/connection-guide", '_blank'); } : switchMetaMaskNetwork}
                text={"Please switch to the correct network"}
                buttonText={isMobile ? "Find out how" : "Switch"}
            />


        </>
    )
}