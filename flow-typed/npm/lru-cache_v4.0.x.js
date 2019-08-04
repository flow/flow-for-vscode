// flow-typed signature: aececd077384aa9821b1049a8b64bea7
// flow-typed version: c6154227d1/lru-cache_v4.0.x/flow_>=v0.104.x

declare module "lru-cache" {
  declare type LRUCache<K, V> = {
    set: (key: K, value: V, maxAge?: number) => void,
    get: (key: K) => V,
    peek: (key: K) => V,
    del: (key: K) => void,
    reset: () => void,
    has: (key: K) => boolean,
    // TODO add the rest of the things documented at https://www.npmjs.com/package/lru-cache
    prune: () => void,
    ...
  };

  declare type Options<K, V> = {
    max?: number,
    maxAge?: number,
    length?: (value: V, key: K) => number,
    dispose?: (key: K, value: V) => void,
    stale?: boolean,
    ...
  };

  // TODO You can supply just an integer (max size), or even nothing at all.
  declare module.exports: <K, V>(options: Options<K, V>) => LRUCache<K, V>;
}
