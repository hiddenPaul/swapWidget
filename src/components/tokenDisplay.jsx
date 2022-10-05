import { Box, Button, Typography, Stack, Paper, Divider, Grid, Container, Item } from "@mui/material";


export default function TokenDisplay({ token, balance }) {
    return (
        <>
            <Box sx={{ padding: 1, textAlign: 'center', textOverflow: 'ellipsis' }}>
                <Paper elevation={2}>
                    <Grid container sx={{ display: 'flex', alignItems: 'center' }}>
                        <Grid item xs={3} sx={{ borderRight: 1 }}>
                            <Typography sx={{ textOverflow: "ellipsis", overflow: 'hidden' }}>
                                {token}
                            </Typography>
                        </Grid>
                        <Grid item xs={9} >
                            <Typography sx={{ textOverflow: "ellipsis", overflow: 'hidden' }}>
                                {balance}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper >
            </Box>
        </>
    );
}