declare module 'gifsicle-wasm-browser' {
  export interface GifsicleInputFile {
    file: File
    name: string
  }
  export interface GifsicleRunOptions {
    input: GifsicleInputFile[]
    command: string[]
  }
  export function run(options: GifsicleRunOptions): Promise<File[]>
  const gifsicle: { run: typeof run }
  export default gifsicle
}
