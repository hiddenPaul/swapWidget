import React from "react";
import { watchToken } from "../utils/metamask";
import { Button } from "@mui/material"

export default function WatchTokenButton({ tokenSymbol }) {
  const [isDisabled, setIsDisabled] = React.useState(false);


  const config = require(`../config/${process.env.NODE_ENV}.config.json`);

  const handleClick = () => {
    setIsDisabled(true);
    watchToken(config[`${tokenSymbol}TokenInfo`]).then(() => {
      setIsDisabled(false);
    })
  }

  return (
    <>
      <Button variant='contained' disabled={isDisabled} onClick={handleClick} sx={{width: "100%", fontFamily: "Play"}}>
        Watch {tokenSymbol} in MetaMask
      </Button>
    </>
  )
}

