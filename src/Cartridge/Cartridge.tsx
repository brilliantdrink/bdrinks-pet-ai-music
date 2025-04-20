import {Accessor, createEffect, createSignal, For, JSX, onCleanup, onMount, Setter} from 'solid-js'
import createEmblaCarousel from 'embla-carousel-solid'
import {default as cn} from 'classnames'
import lofiAMeta from '../songs/lofi-a/meta.json'

import styles from './cartridge.module.scss'

interface CartridgeProps {
  mounted: Accessor<boolean>
  setMounted: Setter<boolean>
  cartridgeSettled: Accessor<boolean>
  setCartridgeSettled: Setter<boolean>
  mountButtonsEdge: Accessor<boolean>
  triggerMountButtonsEdge: () => void
}

export const formatDuration = (duration: number) => `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`

export default function Cartridge({
                                    mounted, setMounted,
                                    cartridgeSettled, setCartridgeSettled,
                                    mountButtonsEdge,
                                    triggerMountButtonsEdge,
                                  }: CartridgeProps) {
  const [emblaRef, emblaApi] = createEmblaCarousel(() => ({
    align: 'center',
    containScroll: false,
    watchDrag: false
  }))
  const [selectedScrollSnap, setSelectedScrollSnap] = createSignal(0)

  function handleSelectedScrollSnapChange() {
    const index = emblaApi()?.selectedScrollSnap() ?? 0
    const slidesAmount = emblaApi()?.scrollSnapList().length ?? 0
    if (index === (slidesAmount - 1)) {
      setTimeout(() => emblaApi()?.scrollPrev(), 50)
    } else {
      setSelectedScrollSnap(index)
    }
  }

  createEffect(() => {
    const api = emblaApi()
    api?.on('select', handleSelectedScrollSnapChange)
    onCleanup(() => api?.off('select', handleSelectedScrollSnapChange))
  })

  function handleInsertButtonClick() {
    setMounted(!mounted())
    triggerMountButtonsEdge()
  }

  return <>
    <div class={styles.slider} ref={emblaRef}>
      <div>
        <div class={styles.wrapper}>
          <div class={cn(styles.info)}>
            <p class={cn(styles.title)}>lo-fi chill (a)</p>
            <small>
              {lofiAMeta.tracks.length} Tracks | Runtime:&nbsp;
              {formatDuration(lofiAMeta.tracks.reduce((acc: number, song: { duration: number }) => acc + song.duration, 0))}
            </small>
            {/* @ts-ignore */}
            <table cellspacing="0">
              <tbody>
              <For each={lofiAMeta.tracks}>
                {song => <tr>
                  <td>{song.name}</td>
                  <td>{formatDuration(song.duration)}</td>
                </tr>}
              </For>
              </tbody>
            </table>
          </div>
          <div
            class={cn(styles.cartridge, mounted() ? styles.in : ((mountButtonsEdge() || !cartridgeSettled()) && styles.out))}
            onAnimationStart={() => setCartridgeSettled(false)} onAnimationEnd={() => setCartridgeSettled(true)} />
        </div>
        <div class={styles.wrapper}>
          <div class={cn(styles.cartridge, styles.placeholder)} />
        </div>
      </div>
      <ArrowLongLeft class={cn(
        styles.prev,
        (mounted() || selectedScrollSnap() === 0) && styles.disabled
      )} onClick={() => emblaApi()?.scrollPrev()} />
      <ArrowLongRight class={cn(styles.next, mounted() && styles.disabled)} onClick={() => emblaApi()?.scrollNext()} />
    </div>

    <button onClick={handleInsertButtonClick} class={cn(styles.button, mounted() && styles.hide)}>
      Insert
    </button>
  </>
}

function ArrowLongRight(props: JSX.SvgSVGAttributes<any>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
         {...props}>
      <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
    </svg>
  )
}

function ArrowLongLeft(props: JSX.SvgSVGAttributes<any>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
         {...props}>
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
    </svg>
  )
}

