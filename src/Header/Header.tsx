import styles from './header.module.scss'
import {default as cn} from 'classnames'

export default function Header() {
  return <>
    <header class={styles.header}>
      <div class={styles.logo}></div>
      <hr class={styles.vr}/>
      <span class={cn(styles.gap, styles.title)}>shitty ai music</span>
    </header>
  </>
}
