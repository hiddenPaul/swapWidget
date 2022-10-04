import BigNumber from 'bignumber.js'
import GlobalCheckClaimStatus from 'components/GlobalCheckClaimStatus'
import { useAccountEventListener } from 'hooks/useAccountEventListener'
import useEagerConnect from 'hooks/useEagerConnect'
import useSentryUser from 'hooks/useSentryUser'
import useThemeCookie from 'hooks/useThemeCookie'
import useUserAgent from 'hooks/useUserAgent'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor, useStore } from 'state'
import { usePollBlockNumber } from 'state/block/hooks'
import { usePollCoreFarmData } from 'state/farms/hooks'
import { CHAIN_IDS } from 'utils/wagmi'
import { Blocklist, Updaters } from '..'
import Providers from '../Providers'
import GlobalStyle from '../style/Global'
import Swap from '../views/Swap'


// This config is required for number formatting
BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

function GlobalHooks() {
  usePollBlockNumber()
  useEagerConnect()
  usePollCoreFarmData()
  useUserAgent()
  useAccountEventListener()
  useSentryUser()
  useThemeCookie()
  return null
}

function SwapWidget() {
  const store = useStore()

  return (
    <>
      <Providers store={store}>
        <Blocklist>
          <GlobalHooks />
          <GlobalStyle />
          <GlobalCheckClaimStatus excludeLocations={[]} />
          <PersistGate loading={null} persistor={persistor}>
            <Updaters />
            <Swap />
          </PersistGate>
        </Blocklist>
      </Providers>
    </>
  )
}

SwapWidget.chains = CHAIN_IDS

export default SwapWidget
