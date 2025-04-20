import p5 from 'p5'
import {Accessor} from 'solid-js'

import Framebuffer from './Framebuffer'

import vert from './crt.vert'
import frag from './crt.frag'
import font from '../fonts/MartianMono-Medium.ttf'
import type {AnimatedText, StaticText, Texts} from './Device'

type TextAccessor = Accessor<Texts>

export default function Sketch(texts: TextAccessor, sketch: p5) {
  const pixelation_level = 6;
  let fbo: Framebuffer, crtShader: p5.Shader, textScreen: p5.Graphics, martianMono: p5.Font

  sketch.preload = () => {
    martianMono = sketch.loadFont(font)
  }

  sketch.setup = () => {
    sketch.createCanvas(1560, 470, sketch.WEBGL)
    sketch.pixelDensity(1)

    textScreen = sketch.createGraphics(1560, 470)

    fbo = new Framebuffer(sketch)
    crtShader = sketch.createShader(vert, frag)

    sketch.drawingContext.disable(sketch.drawingContext.DEPTH_TEST)
    sketch.drawingContext.enable(sketch.drawingContext.BLEND)
  }

  sketch.draw = () => {
    if (sketch.frameCount % 60) redrawTextSprite(textScreen, martianMono, texts, pixelation_level)
    fbo.draw(() => {
      sketch.push()
      sketch.clear()

      // sketch.background(127)
      sketch.image(textScreen, -sketch.width / 2, -sketch.height / 2)

      sketch.pop()
    })

    sketch.clear()

    sketch.push()

    sketch.noStroke()
    sketch.rectMode(sketch.CENTER)
    sketch.shader(crtShader)
    // @ts-ignore
    sketch._renderer.textures.get('colorP5Texture')
      // @ts-ignore
      .setInterpolation(sketch._renderer.GL.NEAREST, sketch._renderer.GL.NEAREST)
    // @ts-ignore
    crtShader.setUniform('textureSampler', sketch._renderer.textures.get('colorP5Texture'))
    crtShader.setUniform('screenResolution', [sketch.height / pixelation_level, sketch.width / pixelation_level])
    crtShader.setUniform('scanLineOpacity', [1, 1])
    crtShader.setUniform('vignetteOpacity', 1)
    crtShader.setUniform('brightness', 4)
    crtShader.setUniform('vignetteRoundness', 2.0)

    sketch.rect(0, 0, sketch.width, -sketch.height)
    sketch.pop()
  }
}

const isAnimatedText = (text: AnimatedText | StaticText): text is AnimatedText => Array.isArray(text.str)
const selectText = (text: AnimatedText) => {
  const currentP = (performance.now() % text.duration) / text.duration
  let selectedStr
  for (let i = text.str.length - 1; i >= 0; i--) if (text.str[i].p < currentP) {
    selectedStr = text.str[i]
    break
  }
  return selectedStr
}

function redrawTextSprite(textScreen: p5.Graphics, martianMono: p5.Font, texts: TextAccessor, pixelation_level: number) {
  textScreen.background(0)
  textScreen.textFont(martianMono)
  for (const text of texts()) {
    textScreen.textSize(text.size)
    textScreen.textAlign('align' in text && text.align ? text.align : 'left')
    // textScreen.fill(255, 127, 0)
    textScreen.fill(191, 64, 255)
    if (isAnimatedText(text)) {
      textScreen.text(selectText(text)?.text ?? '', text.x, text.y)
    } else {
      textScreen.text(text.str, text.x, text.y)
    }
  }
  textScreen.filter(textScreen.BLUR, 24)
  for (const text of texts()) {
    textScreen.textSize(text.size)
    textScreen.textAlign('align' in text && text.align ? text.align : 'left')
    // textScreen.fill(255, 127, 64)
    textScreen.fill(191, 95, 255)
    if (isAnimatedText(text)) {
      textScreen.text(selectText(text)?.text ?? '', text.x, text.y)
    } else {
      textScreen.text(text.str, text.x, text.y)
    }
  }

  textScreen.loadPixels()
  textScreen.noStroke()
  for (let x = 0; x < textScreen.width; x += pixelation_level) {
    for (let y = 0; y < textScreen.height; y += pixelation_level) {
      let i = (x + y * textScreen.width) * 4

      let r = textScreen.pixels[i + 0]
      let g = textScreen.pixels[i + 1]
      let b = textScreen.pixels[i + 2]
      let a = textScreen.pixels[i + 3]

      textScreen.fill(r, g, b, a)
      textScreen.square(x - 1, y - 3, pixelation_level)
    }
  }
}
