// flow-typed signature: 14e5e212dd7ed5c1db95d28a9d629409
// flow-typed version: 94e9f7e0a4/fuzzaldrin_v2.x.x/flow_>=v0.25.x

declare module 'fuzzaldrin' {
  declare module.exports: {
    score(string: string, query: string): number,
    filter<T: string|Object>(candidates: Array<T>, query: string, options?: {
      key?: string,
      maxResults?: number,
    }): Array<T>,
  }
}
