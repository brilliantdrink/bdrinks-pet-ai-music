declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.txt' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module '*.webp' {
  const filePath: string;
  export default filePath;
}

declare module '*.svg' {
  const filePath: string;
  export default filePath;
}

declare module '*.mp3' {
  const filePath: string;
  export default filePath;
}

declare module '*.vert' {
  const contents: string;
  export default contents;
}

declare module '*.frag' {
  const contents: string;
  export default contents;
}

declare module '*.woff2' {
  const filePath: string;
  export default filePath;
}

declare module '*.ttf' {
  const filePath: string;
  export default filePath;
}
