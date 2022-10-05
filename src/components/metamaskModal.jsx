import { Button, Modal, Typography, Box, Link } from "@mui/material";
import React from "react";
import { connectToMetamask } from "../utils/metamask";



const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    textAlign: 'center',
};

export default function MetamaskModal({handleClose, func, text, buttonText, open, linkText, linkURL}) {
    const [buttonEnabled, setButtonEnabled] = React.useState(true);

    const handleButtonPress = () => {
        const run = async () => {
            let connected = await func();
            if (connected) {
                handleClose();
                return true;
            } else {
                return false;
            }
        }

        setButtonEnabled(false);
        run().then((res) => {
            if (!res) {
                setButtonEnabled(true);
            }
        });
    }

    return (
        <>
            <Modal open={open} onClose={handleClose}>
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ whiteSpace: "pre-line"}}>
                        {text}
                    </Typography>
                    <Link href={linkURL} target="_blank" rel="noreferrer noopener">
                        {linkText}
                    </Link>
                    <Button
                        disabled={!buttonEnabled}
                        variant="contained"
                        sx={{
                            mt: 2,
                            width: '100%',
                        }}
                        onClick={handleButtonPress}>
                        {buttonText}
                    </Button>
                </Box>
            </Modal>
        </>
    );
}