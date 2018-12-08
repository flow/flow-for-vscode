/* @flow */
export type MessageActionItem = {
  // A short title like 'Retry', 'Open Log' etc.
  title: string
};

// window/showStatus is a Nuclide-specific extension to LSP
// for reporting whether the LSP server is ready to handle requests
export type ShowStatusParams = {
  // The message type, {@link MessageType}. Permits only Error, Warning, Info.
  type: number,
  // The message action items to present. Only allowed for Error.
  actions?: Array<MessageActionItem>,
  // The actual message. Mandatory for Error, Warning.
  message?: string,
  // An optional short message, hopefully <8chars, to appear prominently
  shortMessage?: string,
  // The client might display a progress bar "numerator/denominator" if both are
  // present, or an indeterminate progress bar if only numerator is present.
  progress?: { numerator: number, denominator?: number }
};

export const LspMessageType = {
  // An error message.
  Error: 1,
  // A warning message.
  Warning: 2,
  // An information message.
  Info: 3,
  // A log message.
  Log: 4
};
