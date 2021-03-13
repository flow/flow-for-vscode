/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import invariant from 'assert';
import {CompositeDisposable, Disposable} from 'event-kit';
import {Observable, ReplaySubject, Subscription} from 'rxjs';

/**
 * Observe a stream like stdout or stderr.
 */
export function observeStream(stream: stream$Readable): Observable<string> {
  return observeRawStream(stream).map(data => data.toString());
}

export function observeRawStream(stream: stream$Readable): Observable<Buffer> {
  const error = Observable.fromEvent(stream, 'error').flatMap(Observable.throw);
  return Observable
    .fromEvent(stream, 'data')
    .merge(error)
    .takeUntil(Observable.fromEvent(stream, 'end'));
}

/**
 * Splits a stream of strings on newlines.
 * Includes the newlines in the resulting stream.
 * Sends any non-newline terminated data before closing.
 * Never sends an empty string.
 */
export function splitStream(input: Observable<string>): Observable<string> {
  return Observable.create(observer => {
    let current: string = '';

    function onEnd() {
      if (current !== '') {
        observer.next(current);
        current = '';
      }
    }

    return input.subscribe(
      value => {
        const lines = (current + value).split('\n');
        current = lines.pop();
        lines.forEach(line => observer.next(line + '\n'));
      },
      error => { onEnd(); observer.error(error); },
      () => { onEnd(); observer.complete(); },
    );
  });
}

export class DisposableSubscription {
  _subscription: Subscription;

  constructor(subscription: Subscription) {
    this._subscription = subscription;
  }

  dispose(): void {
    this._subscription.unsubscribe();
  }
}

type TeardownLogic = (() => void) | Subscription;

export class CompositeSubscription {
  _subscription: Subscription;

  constructor(...subscriptions: Array<TeardownLogic>) {
    this._subscription = new Subscription();
    subscriptions.forEach(sub => {
      this._subscription.add(sub);
    });
  }

  unsubscribe(): void {
    this._subscription.unsubscribe();
  }
}

// TODO: We used to use `stream.buffer(stream.filter(...))` for this but it doesn't work in RxJS 5.
//  See https://github.com/ReactiveX/rxjs/issues/1610
export function bufferUntil<T>(
  stream: Observable<T>,
  condition: (item: T) => boolean,
): Observable<Array<T>> {
  return Observable.create(observer => {
    let buffer = null;
    const flush = () => {
      if (buffer != null) {
        observer.next(buffer);
        buffer = null;
      }
    };
    return stream
      .subscribe(
        x => {
          if (buffer == null) {
            buffer = [];
          }
          buffer.push(x);
          if (condition(x)) {
            flush();
          }
        },
        err => {
          flush();
          observer.error(err);
        },
        () => {
          flush();
          observer.complete();
        },
      );
  });
}

/**
 * Like Observable.prototype.cache(1) except it forgets the cached value when there are no
 * subscribers. This is useful so that if consumers unsubscribe and then subscribe much later, they
 * do not get an ancient cached value.
 *
 * This is intended to be used with cold Observables. If you have a hot Observable, `cache(1)` will
 * be just fine because the hot Observable will continue producing values even when there are no
 * subscribers, so you can be assured that the cached values are up-to-date.
 */
export function cacheWhileSubscribed<T>(input: Observable<T>): Observable<T> {
  return input.multicast(() => new ReplaySubject(1)).refCount();
}

type Diff<T> = {
  added: Set<T>;
  removed: Set<T>;
};

function subtractSet<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set();
  a.forEach(value => {
    if (!b.has(value)) {
      result.add(value);
    }
  });
  return result;
}

/**
 * Shallowly compare two Sets.
 */
function setsAreEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}

/**
 * Given a stream of sets, return a stream of diffs.
 * **IMPORTANT:** These sets are assumed to be immutable by convention. Don't mutate them!
 */
export function diffSets<T>(stream: Observable<Set<T>>): Observable<Diff<T>> {
  return Observable.concat(
      Observable.of(new Set()), // Always start with no items with an empty set
      stream,
    )
    .distinctUntilChanged(setsAreEqual)
    .pairwise()
    .map(([previous, next]) => ({
      added: subtractSet(next, previous),
      removed: subtractSet(previous, next),
    }));
}

/**
 * Give a stream of diffs, perform an action for each added item and dispose of the returned
 * disposable when the item is removed.
 */
export function reconcileSetDiffs<T>(
  diffs: Observable<Diff<T>>,
  addAction: (addedItem: T) => any,
): any {
  const itemsToDisposables = new Map();
  const disposeItem = item => {
    const disposable = itemsToDisposables.get(item);
    invariant(disposable != null);
    disposable.dispose();
    itemsToDisposables.delete(item);
  };
  const disposeAll = () => {
    itemsToDisposables.forEach(disposable => { disposable.dispose(); });
    itemsToDisposables.clear();
  };

  return new CompositeDisposable(
    new DisposableSubscription(
      diffs.subscribe(diff => {
        // For every item that got added, perform the add action.
        diff.added.forEach(item => { itemsToDisposables.set(item, addAction(item)); });

        // "Undo" the add action for each item that got removed.
        diff.removed.forEach(disposeItem);
      })
    ),
    new Disposable(disposeAll),
  );
}

export function toggle<T>(
  source: Observable<T>,
  toggler: Observable<boolean>,
): Observable<T> {
  return toggler
    .distinctUntilChanged()
    .switchMap(enabled => (enabled ? source : Observable.empty()));
}

export function compact<T>(source: Observable<?T>): Observable<T> {
  // Flow does not understand the semantics of `filter`
  return (source.filter(x => x != null): any);
}

/**
 * Like `takeWhile`, but includes the first item that doesn't match the predicate.
 */
export function takeWhileInclusive<T>(
  source: Observable<T>,
  predicate: (value: T) => boolean,
): Observable<T> {
  return Observable.create(observer => (
    source.subscribe(
      x => {
        observer.next(x);
        if (!predicate(x)) {
          observer.complete();
        }
      },
      err => { observer.error(err); },
      () => { observer.complete(); },
    )
  ));
}
