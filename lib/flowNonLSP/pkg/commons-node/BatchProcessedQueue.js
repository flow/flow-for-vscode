/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

export type BatchHandler<T> = (batch: Array<T>) => void;

// A Queue which will process elements at intervals, only if the
// queue contains any elements.
export default class BatchProcessedQueue<T> {
  _batchPeriod: number;
  _handler: BatchHandler<T>;
  _timeoutId: ?TimeoutID;
  _items: Array<T>;

  constructor(batchPeriod: number, handler: BatchHandler<T>) {
    this._batchPeriod = batchPeriod;
    this._handler = handler;
    this._timeoutId = null;
    this._items = [];
  }

  add(item: T): void {
    this._items.push(item);
    if (this._timeoutId === null) {
      this._timeoutId = setTimeout(() => {
        this._handleBatch();
      }, this._batchPeriod);
    }
  }

  _handleBatch() {
    this._timeoutId = null;
    const batch = this._items;
    this._items = [];
    this._handler(batch);
  }

  dispose(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._handleBatch();
    }
  }
}
