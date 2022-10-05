import * as React from 'react';
import Navbar from '../components/navbar'
import SwapWidget from '../components/SwapWidget';
import { Typography, Paper, Grid, alpha, Container, ToggleButtonGroup, ToggleButton } from '@mui/material'

export default function FiatGateway() {
    const [widgetState, setWidget] = React.useState('buy');
  
    const changeWidget = (event, newWidgetState) => {
      if (newWidgetState !== null) {
        setWidget(newWidgetState);
      }
    };



    return (
        <>
            <Navbar />
            <Container sx={{mt:'10px' }}>
                <Grid container direction="row-reverse" spacing={1} align= "center" justifyContent="center">
                    <Grid item xs={12} sm={6} md={4} >
                        <ToggleButtonGroup value={widgetState} exclusive onChange={changeWidget} fullWidth={true} sx={{bgcolor:alpha('#002A3C', 0.75)}}>
                            <ToggleButton value='buy' sx={{"&.Mui-selected, &.Mui-selected:hover":{color: '#11E2F2', backgroundColor: '#32667D'}, color: 'white'}}>
                                Buy
                            </ToggleButton>
                            <ToggleButton value='swap' sx={{"&.Mui-selected, &.Mui-selected:hover":{color: '#11E2F2', backgroundColor: '#32667D'}, color: 'white'}}>
                                Swap
                            </ToggleButton>
                        </ToggleButtonGroup>
                        {
                            widgetState == 'buy'
                            ?<iframe
                                id="iframe" 
                                src="https://widget.onramper.com?color=32667D&defaultCrypto=BNB_BEP20&onlyGateways=Mercuryo,Transak&supportSell=true&apiKey=pk_test_x5M_5fdXzn1fxK04seu0JgFjGsu7CH8lOvS9xZWzuSM0"
                                height="725px"
                                width="100%"
                                allow="accelerometer; autoplay; camera; gyroscope; payment;"
                            ></iframe>
                            :<SwapWidget />
                        }
                    </Grid>
                    <Grid item xs={12} sm={6} md={8}>
                        <Paper elevation={3} sx={{bgcolor:alpha('#002A3C', 0.75)}}>
                            <Typography variant="h2" sx={{fontFamily: 'Play', textAlign: 'left', color:'white'}}>
                                Purchase FLS
                            </Typography>
                            <Typography variant="h4" sx={{fontFamily: 'Play', textAlign: 'left', color:'white'}}>
                                Purchase BNB
                            </Typography>
                            <Typography variant="h6" sx={{fontFamily: 'Play', textAlign: 'left', mt:1, color:'white'}}>
                                {"Click the 'Buy' button at the top of the widget, and follow through the prompts. You will need to enter your wallet addresss, so be sure to have it on hand. When complete, verify that the BNB has been deposited in your wallet."}
                            </Typography>
                            <Typography variant="h4" sx={{fontFamily: 'Play', textAlign: 'left', mt:2, color:'white'}}>
                                Swap for FLS
                            </Typography>
                            <Typography variant="h6" sx={{fontFamily: 'Play', textAlign: 'left', mt:1, color:'white'}}>
                                {"Click the 'Swap' button at the top of the widget. Click 'Connect' at the top or 'Connect Wallet' at the bottom to link your wallet."}
                            </Typography>
                            <Typography variant="h6" sx={{fontFamily: 'Play', textAlign: 'left', color:'white'}}>
                                Follow through the prompts to complete swap trading BNB in wallet into FLS. When complete, verify that FLS has been deposited in your wallet.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
            
        </>
    )
}