import throttle from 'lodash.throttle'
import soundButtonPress from './sounds/ui-buttonpress.mp3'
import soundButtonUp from './sounds/ui-buttonup.mp3'

// @ts-ignore
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const songContext = new AudioContext();
const songGainNode = songContext.createGain();
songGainNode.gain.value = .1;

function loadAudio(url: string) {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
}

let loadedSong: AudioBuffer | null = null, songSource: AudioBufferSourceNode | null = null,
  pausedAt: number | null = null, startedAt: number | null = null

export async function loadSong(url: string) {
  loadedSong = await fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
  pausedAt = null
  startedAt = null
}

export enum Sounds {
  ButtonPress = 'ButtonPress',
  ButtonUp = 'ButtonUp',
}

const gains = {
  [Sounds.ButtonPress]: .3,
  [Sounds.ButtonUp]: .6
}

const gainNodes = Object.fromEntries(Array.from(new Set(Object.values(gains))).map(gainValue => {
  const gainNode = audioContext.createGain()
  gainNode.gain.value = gainValue
  return [gainValue, gainNode]
}))

const buffers = {} as Record<Sounds, AudioBuffer>
loadAudio(soundButtonPress).then(decodedData => buffers[Sounds.ButtonPress] = decodedData)
loadAudio(soundButtonUp).then(decodedData => buffers[Sounds.ButtonUp] = decodedData)

export function playSound(sound: Sounds) {
  const audioBuffer = buffers[sound]
  audioContext.resume()
  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  if (sound in gains) {
    const gainNode = gainNodes[gains[sound]]
    source.connect(gainNode)
    gainNode.connect(audioContext.destination)
  } else {
    source.connect(audioContext.destination)
  }
  source.start(0)
}

export function playSong(endedCb: () => void) {
  skippingInterval !== null && clearInterval(skippingInterval)
  songContext.resume()
  songSource?.stop(0)
  songSource = songContext.createBufferSource()
  songSource.buffer = loadedSong
  songSource.connect(songGainNode)
  songGainNode.connect(songContext.destination)
  songSource.addEventListener('ended', endedCb)
  if (pausedAt) {
    startedAt = Date.now() - pausedAt;
    songSource.start(0, pausedAt / 1000);
  } else {
    startedAt = Date.now();
    songSource.start(0);
  }
}

let skippingInterval: number | null = null

export function pauseSong() {
  skippingInterval !== null && clearInterval(skippingInterval)
  if (!startedAt) return
  songSource?.stop(0)
  pausedAt = Date.now() - startedAt;
  songSource = null;
}

export function stopSong() {
  skippingInterval !== null && clearInterval(skippingInterval)
  songSource?.stop(0)
  songSource = null;
  pausedAt = null;
  startedAt = null;
}

export function startRewinding() {
  pauseSong()
  skippingInterval = setInterval(() => (pausedAt as number) -= 1000, 100)
}

export function startForwarding() {
  pauseSong()
  skippingInterval = setInterval(() => (pausedAt as number) += 1000, 30)
}

export function stopSkipping() {
  skippingInterval !== null && clearInterval(skippingInterval)
  startedAt = Date.now() - (pausedAt ?? Date.now());
}

export function getPlayHeadPosition() {
  return Math.round((Date.now() - (startedAt ?? Date.now())) / 1000)
}

export function getPausedPosition() {
  return Math.round((pausedAt ?? 0) / 1000)
}

export const playSoundThrottled = throttle(playSound, 20)
