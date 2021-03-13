/* @flow */

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import { window, StatusBarAlignment } from 'vscode';
import { isFlowStatusEnabled } from './utils/util'
import type { StatusBarItem } from 'vscode';
import Spinner from 'elegant-spinner';

export class Status {
  statusBarItem:StatusBarItem;
  state:?{id:IntervalID}

  static spin:() => string = Spinner()
  static createStatusBarItem(): StatusBarItem {
    const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    statusBarItem.tooltip = 'Flow is type checking';
    statusBarItem.command = 'flow.show-output';
    return statusBarItem;
  }
  static render(status:Status):void {
    return status.render();
  }
  constructor() {
    this.statusBarItem = Status.createStatusBarItem();
  }
  isBusy(): boolean {
    return this.state != null
  }
  idle() {
    this.update(false);
  }
  busy() {
    this.update(isFlowStatusEnabled());
  }
  update(busy:boolean) {
    const {state} = this
    if (state && !busy) {
      clearInterval(state.id)
      this.state = null
    }

    if (!state && busy) {
      this.state = {id: setInterval(Status.render, 100, this)}
    }

    if (state != this.state) {
      this.render()
    }
  }
  render() {
    if (this.isBusy()) {
      this.statusBarItem.show();
      this.statusBarItem.text = `Flow: ${Status.spin()}`;
    } else {
      this.statusBarItem.hide();
      this.statusBarItem.text = ``
    }
  }
}

export default Status;
