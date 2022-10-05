import { useMemo, useState } from 'react'
import { ChainId } from '@pancakeswap/sdk'
import { Flex, useMatchBreakpoints } from '@pancakeswap/uikit'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useDefaultsFromURLSearch } from 'state/limitOrders/hooks'
import { AppBody } from 'components/App'
import { Typography, Paper, Grid, alpha, Container, ToggleButtonGroup, ToggleButton } from '@mui/material'

import { useExchangeChartManager } from '../../state/user/hooks'
import Page from '../Page'

import SwapForm from './components/SwapForm'
import { StyledInputCurrencyWrapper, StyledSwapContainer } from './styles'

export const ACCESS_TOKEN_SUPPORT_CHAIN_IDS = [ChainId.BSC]


export default function Swap() {

  useDefaultsFromURLSearch()


  const { chainId } = useActiveWeb3React()


  const isAccessTokenSupported = useMemo(() => ACCESS_TOKEN_SUPPORT_CHAIN_IDS.includes(chainId), [chainId])

  return (
    <Paper elevation={3} sx={{bgcolor:"#002A3C"}}>
      <SwapForm
        isAccessTokenSupported={isAccessTokenSupported}
      />
    </Paper>
  )
}
