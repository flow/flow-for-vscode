// flow-typed signature: bfce188e9f98afabd4ac954d5dff4e07
// flow-typed version: c6154227d1/which_v1.x.x/flow_>=v0.104.x

declare module "which" {
  declare type Options = {|
    path?: string, 
    pathExt?: string, 
    all?: boolean
  |};

  declare function whichAsync(cmd: string, cb: (err: ?Error, path: string) => void): void;
  declare function whichAsync(cmd: string, options: Options, cb: (err: ?Error, path: string) => void): void;

  declare function whichSync(cmd: string, options?: Options): string;
  declare function whichSync(cmd: string, options: {|...Options, noThrow?: false|}): string;
  declare function whichSync(cmd: string, options: {|...Options, noThrow: true|}): ?string;

  declare module.exports: {
    [[call]]: typeof whichAsync,
    sync: typeof whichSync,
    ...
  }
}
