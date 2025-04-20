import {createSignal} from 'solid-js'

import './style.scss'
import Header from './Header'
import Device from './Device'
import Cartridge from './Cartridge'

export default function App() {
  const [mounted, setMounted] = createSignal(false)
  const [cartridgeSettled, setCartridgeSettled] = createSignal(true)
  const [mountButtonsEdge, setMountButtonsEdge] = createSignal<boolean>(false)

  function triggerMountButtonsEdge() {
    setMountButtonsEdge(true)
    setTimeout(() => setMountButtonsEdge(false), 10)
  }

  return <>
    <Header />
    <Cartridge mounted={mounted} setMounted={setMounted}
               cartridgeSettled={cartridgeSettled} setCartridgeSettled={setCartridgeSettled}
               mountButtonsEdge={mountButtonsEdge}
               triggerMountButtonsEdge={triggerMountButtonsEdge} />
    <Device mounted={mounted} setMounted={setMounted}
            cartridgeSettled={cartridgeSettled}
            triggerMountButtonsEdge={triggerMountButtonsEdge} />
  </>
}
