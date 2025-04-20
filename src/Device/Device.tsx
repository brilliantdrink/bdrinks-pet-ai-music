import {Accessor, createEffect, createMemo, createSignal, JSX, onMount, Setter} from 'solid-js'
import p5 from 'p5'
import {default as cn} from 'classnames'
import debounce from 'lodash.debounce'

import styles from './device.module.scss'
import Sketch from './Sketch-display'
import {
  getPausedPosition,
  getPlayHeadPosition,
  loadSong,
  pauseSong,
  playSong,
  playSoundThrottled,
  Sounds,
  startForwarding,
  startRewinding, stopSkipping,
  stopSong
} from '../sound'
import lofiAMeta from '../songs/lofi-a/meta.json'
import {formatDuration} from '../Cartridge/Cartridge'

const debounceOpts = {leading: true, trailing: false}

interface DeviceProps {
  mounted: Accessor<boolean>
  setMounted: Setter<boolean>
  cartridgeSettled: Accessor<boolean>
  triggerMountButtonsEdge: () => void
}

interface AbstractText {
  x: number,
  y: number,
  size: number,
  align?: p5.HORIZ_ALIGN
}

export interface StaticText extends AbstractText {
  str: string
}

export interface AnimatedText extends AbstractText {
  str: { p: number, text: string }[]
  duration: number
}

export type Texts = (StaticText | AnimatedText)[]

const loadingTexts: Texts = [
  {
    str: [{p: 0, text: 'Loading.'}, {p: .33, text: 'Loading..'}, {p: .66, text: 'Loading...'}],
    duration: 1500,
    x: 60,
    y: 250,
    size: 58
  },
]
const unmountedTexts: Texts = [
  {str: 'Insert cartridge', x: 60, y: 250, size: 58},
  {str: 'v v v', x: 60, y: 350, size: 42},
]

export default function Device({mounted, setMounted, cartridgeSettled, triggerMountButtonsEdge}: DeviceProps) {
  const [isPlaying, setIsPlaying] = createSignal(false)
  const [isSkipping, setIsSkipping] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(true)
  const [songIndex, setSongIndex] = createSignal(0)
  const [playPressed, setPlayPressed] = createSignal(false)
  const [prevPressed, setPrevPressed] = createSignal(false)
  const [nextPressed, setNextPressed] = createSignal(false)

  const loadedTexts: (isPlaying: Accessor<boolean>) => Texts = (isPlaying) => [
    {str: isPlaying() ? 'NOW PLAYING' : 'PAUSED', x: 60, y: 151, size: 42},
    {str: `${songIndex() + 1} of ${lofiAMeta.tracks.length}`, x: 1560 - 60, y: 151, size: 42, align: 'right'},
    {str: `${lofiAMeta.name} — ${lofiAMeta.tracks[songIndex()].name}`, x: 60, y: 250, size: 58},
    {
      str: `${formatDuration(isPlaying() && !isSkipping() ? getPlayHeadPosition() : getPausedPosition())} / ${formatDuration(lofiAMeta.tracks[songIndex()].duration)}`,
      x: 60,
      y: 350,
      size: 42
    },
    {str: 'w/ ANN sounds', x: 1560 - 60, y: 350, size: 42, align: 'right'},
  ]

  const texts = () => {
    if (mounted() && cartridgeSettled()) {
      if (!isLoading()) return loadedTexts(isPlaying)
      else return loadingTexts
    } else {
      return unmountedTexts
    }
  }

  createEffect(async () => {
    if (!mounted()) return
    setIsLoading(true)
    await loadSongFromCartridge(0)
    setIsLoading(false)
  })

  const p5wrapper = <div id={'p5-wrapper'} class={styles.textCanvasWrapper} /> as HTMLDivElement

  onMount(() => {
    let myp5 = new p5(Sketch.bind(null, texts), p5wrapper)
  })

  const ejectStyleClasses = createMemo(() => cn(styles.eject, !mounted() && styles.hide))

  function handleEjectButtonClick() {
    setMounted(false)
    setIsPlaying(false)
    setIsLoading(true)
    setSongIndex(0)
    triggerMountButtonsEdge()
  }

  async function playNext() {
    if (songIndex() === lofiAMeta.tracks.length - 1) {
      stopSong()
      return
    }
    setSongIndex(current => Math.min(current + 1, lofiAMeta.tracks.length))
    await loadSongFromCartridge(songIndex())
    setTimeout(() => playSong(playNext))
  }

  function handlePlayPause() {
    if (mounted() && cartridgeSettled()) {
      setIsPlaying(current => {
        if (current) pauseSong()
        else playSong(playNext)
        return !current
      })
    } else {
      setIsPlaying(false)
      pauseSong()
    }
  }

  async function loadSongFromCartridge(index: number) {
    const songFileName = (await import('../songs/lofi-a/' + lofiAMeta.tracks[index].file)).default
    await loadSong(songFileName)
  }

  function handlePrevClick() {
    stopSong()
    setTimeout(async () => {
      setSongIndex(current => Math.max(current - 1, 0))
      await loadSongFromCartridge(songIndex())
      if (isPlaying()) setTimeout(() => playSong(playNext))
    })
  }

  function handlePrevHold() {
    setIsSkipping(true)
    startRewinding()
  }

  function handleSkipRelease() {
    setIsSkipping(false)
    stopSkipping()
    if (isPlaying()) playSong(playNext)
  }

  function handleNextClick() {
    stopSong()
    setTimeout(async () => {
      setSongIndex(current => Math.min(current + 1, lofiAMeta.tracks.length - 1))
      await loadSongFromCartridge(songIndex())
      if (isPlaying()) setTimeout(() => playSong(playNext))
    })
  }

  function handleNextHold() {
    setIsSkipping(true)
    startForwarding()
  }

  return <>
    <div class={styles.note} />
    <div class={cn(styles.device)} />
    <div class={cn(styles.device, styles.play, playPressed() && styles.pressed)} />
    <div class={cn(styles.device, styles.prev, prevPressed() && styles.pressed)} />
    <div class={cn(styles.device, styles.next, nextPressed() && styles.pressed)} />
    {p5wrapper}
    <InvisibleButton class={cn(styles.play)} pressed={playPressed} setPressed={setPlayPressed}
                     onClick={handlePlayPause} />
    <InvisibleButton class={cn(styles.prev)} pressed={prevPressed} setPressed={setPrevPressed}
                     onClick={handlePrevClick} onHold={handlePrevHold} onRelease={handleSkipRelease} />
    <InvisibleButton class={cn(styles.next)} pressed={nextPressed} setPressed={setNextPressed}
                     onClick={handleNextClick} onHold={handleNextHold} onRelease={handleSkipRelease} />
    <InvisibleButton class={ejectStyleClasses} onClick={handleEjectButtonClick} />
    <button class={cn(styles.button, styles.eject, !mounted() && styles.hide)} onClick={handleEjectButtonClick}>
      Eject <EjectIcon />
    </button>
  </>
}

interface InvisibleButtonCustomProps {
  class: Accessor<string> | string,
  pressed?: Accessor<boolean>
  setPressed?: Setter<boolean>
  onClick?: (e: MouseEvent & { currentTarget: HTMLButtonElement }) => void
  onHold?: () => void
  onRelease?: () => void
}

type InvisibleButtonProps =
  Omit<JSX.ButtonHTMLAttributes<any>, keyof InvisibleButtonCustomProps>
  & InvisibleButtonCustomProps

function InvisibleButton({setPressed, pressed, onClick, ...props}: InvisibleButtonProps) {
  const [preventClick, setPreventClick] = createSignal(false)
  const [preventClickTimeout, setPreventClickTimeout] = createSignal<null | number>(null)

  const press = debounce(() => {
    const timeout = preventClickTimeout()
    if (timeout !== null) clearTimeout(timeout)
    setPreventClickTimeout(setTimeout(() => {
      setPreventClick(true)
      props.onHold?.()
    }, 800))
    playSoundThrottled(Sounds.ButtonPress)
    setPressed?.(true)
  }, 10, debounceOpts)

  const release = debounce(() => {
    const timeout = preventClickTimeout()
    if (timeout !== null) clearTimeout(timeout)
    if (pressed?.()) playSoundThrottled(Sounds.ButtonUp)
    setPressed?.(false)
  }, 10, debounceOpts)

  function handleClick(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
    if (preventClick()) {
      setPreventClick(false)
      props.onRelease?.()
      return
    }
    onClick?.(e)
  }

  return (
    <button onPointerDown={press} onMouseDown={press}
            onPointerUp={release} onPointerCancel={release} onPointerLeave={release}
            onMouseUp={release} onMouseLeave={release}
            onClick={handleClick} {...props}
            class={cn(styles.button, styles.invisible, typeof props.class === 'function' ? props.class() : props.class)} />
  )
}


function EjectIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="22" height="22" fill="none">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M12.244 14.96c-.425.527-.638.79-.895.886a1 1 0 0 1-.698 0c-.257-.095-.47-.359-.895-.886l-2.712-3.354c-.674-.834-1.01-1.25-1.012-1.601a1 1 0 0 1 .375-.786C6.68 9 7.217 9 8.288 9h5.424c1.071 0 1.607 0 1.881.22a1 1 0 0 1 .375.785c-.002.35-.338.767-1.012 1.6l-2.712 3.355ZM6 6.5h10" />
    </svg>
  )
}
