// flow-typed signature: e93785ee18dd58c4d2996b0b0ec61179
// flow-typed version: c6154227d1/fuzzaldrin_v2.x.x/flow_>=v0.104.x

declare module 'fuzzaldrin' {
  declare module.exports: {
    score(string: string, query: string): number,
    filter<T: string|Object>(candidates: Array<T>, query: string, options?: {
      key?: string,
      maxResults?: number,
      ...
    }): Array<T>,
    ...
  }
}
