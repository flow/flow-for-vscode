/* @flow */
import * as vscode from 'vscode';
import path from 'path';

import * as lsp from '../utils/LanguageClient';
import LanguageClientEx from '../utils/LanguageClient/Client';
import { type StatusReport } from '../utils/LanguageClient/StatusFeature/types';
import StatusBarWidget from './StatusBarWidget';
import createMiddleware from './createMiddleware';
import ClientCommands from './ClientCommands';
import * as UUID from 'vscode-languageclient/lib/utils/uuid';

import getFlowPath from '../utils/getFlowPath';
import getFlowVersion from '../utils/getFlowVersion';
import assertFlowSupportsLSP from '../utils/assertFlowSupportsLSP';
import uriToString from '../utils/uriToString';

import Logger, { type LogLevel } from '../utils/Logger';

type Config = {|
  useNPMPackagedFlow: boolean,
  pathToFlow: string,
  useBundledFlow: boolean,
  stopFlowOnExit: boolean,
  liveSyntaxErrors: boolean,
  useCodeSnippetOnFunctionSuggest: boolean,
  lazyMode: string | null,
  logLevel: LogLevel,
  coverage: {|
    showUncovered: boolean,
    diagnosticSeverity: vscode.DiagnosticSeverityType,
  |},
|};

type Options = {|
  flowconfigPath: string,
  workspaceRoot: string,
  outputChannel: vscode.OutputChannel,
  canUseRelativePattern: boolean,
  getConfig: () => Config,
|};

export default class FlowLanguageClient {
  _options: Options;
  _statusBarWidget: StatusBarWidget;
  _logger: Logger;
  _client: ?lsp.LanguageClient = null;
  _id: string;

  commands: ClientCommands;

  constructor(options: Options) {
    this._id = UUID.generateUuid();
    this._options = options;

    this.commands = new ClientCommands(this);
    this._statusBarWidget = new StatusBarWidget({
      clientName: this.getName(),
      flowconfig: this._options.flowconfigPath,
      onClickCommand: this.commands.clientActions,
    });

    this._init();
  }

  getID(): string {
    return this._id;
  }

  getStatus(): null | StatusReport {
    return this._statusBarWidget.getStatus();
  }

  dispose(): Promise<void> {
    this._statusBarWidget.dispose();
    this.commands.dispose();
    return this._disposeClient();
  }

  getName(): string {
    const { _options } = this;
    return path.relative(
      path.dirname(_options.workspaceRoot),
      _options.flowconfigPath,
    );
  }

  restart() {
    this._logger.info('restarting client');
    // NOTE: re-initializing instead of restarting client
    // as this will handle more error edge cases
    // (example flow is removed so we need to find flow again)
    this._reinit();
  }

  setActive(val: boolean) {
    if (val) {
      this._statusBarWidget.show();
    } else {
      this._statusBarWidget.hide();
    }
  }

  getWorkspaceRoot(): string {
    return this._options.workspaceRoot;
  }

  getFlowconfig(): string {
    return this._options.flowconfigPath;
  }

  getLogger(): Logger {
    return this._logger;
  }

  async _reinit() {
    try {
      await this._disposeClient();
    } catch (err) {
      // ignore error if disposeClient failed
    }
    await this._init();
  }

  async _init() {
    try {
      const config = this._options.getConfig();
      this._logger = this._createLogger(config);
      this._client = await this._createClient(config);
      this._client.start();
    } catch (err) {
      this._handleInitError(err);
    }
  }

  async _createClient(config: Config): Promise<LanguageClientEx> {
    const { _logger, _options, _statusBarWidget } = this;
    const { outputChannel, flowconfigPath, workspaceRoot } = _options;

    const flowconfigDir = path.dirname(flowconfigPath);

    const flowPath = await getFlowPath({
      pathToFlow: config.pathToFlow,
      flowconfigDir: path.dirname(flowconfigPath),
      workspaceRoot,
      useNPMPackagedFlow: config.useNPMPackagedFlow,
      useBundledFlow: config.useBundledFlow,
      logger: _logger,
    });

    const flowVersion = await getFlowVersion(flowPath);

    _logger.info(`Using flow '${flowPath}' (v${flowVersion})`);

    // make sure flow support `flow lsp`
    assertFlowSupportsLSP(flowVersion);

    _statusBarWidget.setFlowInfo({ path: flowPath, version: flowVersion });

    const serverOptions: lsp.ServerOptions = {
      command: flowPath,
      args: [
        'lsp',
        ...['--from', 'vscode'],
        ...(config.lazyMode ? ['--lazy-mode', config.lazyMode] : []),
        // auto stop flow process
        config.stopFlowOnExit ? '--autostop' : null,
      ].filter(Boolean),

      // see: clientOptions.workspaceFolder below
      // options: { cwd: flowconfigDir },
    };

    const patternGlob = '**/*';
    const pattern: vscode.GlobPattern = this._options.canUseRelativePattern
      ? // all files inside flowconfigDir
        new vscode.RelativePattern(flowconfigDir, patternGlob)
      : patternGlob;

    const clientOptions: lsp.LanguageClientOptions = {
      // NOTE: nested .flowconfig filtering not possible using only documentSelector
      // so also using middleware to filter out nested files request from parent clients
      documentSelector: [
        { scheme: 'file', language: 'javascript', pattern },
        { scheme: 'file', language: 'javascriptreact', pattern },
      ],
      middleware: createMiddleware(flowconfigPath, flowVersion),

      uriConverters: {
        code2Protocol: uriToString,
        protocol2Code: (value) => vscode.Uri.parse(value),
      },

      outputChannel,

      // flow lsp throws error in many cases and lsp client by default opens up output panel on error
      // Should we make this configurable?? Maybe it's useful to know why some commands not working
      // in some cases.
      revealOutputChannelOn: lsp.RevealOutputChannelOn.Never,

      initializationOptions: {
        // [Partial 'runOnEdit' support]
        // flow lsp currently only support live syntax errors
        liveSyntaxErrors: config.liveSyntaxErrors,
        useCodeSnippetOnFunctionSuggest: config.useCodeSnippetOnFunctionSuggest,
      },

      initializationFailedHandler: (error) => {
        this._handleInitError(error);
        // don't initialize again let user decide what to do
        return false;
      },

      errorHandler: {
        // called when `flow lsp` connection throws error
        // eslint-disable-next-line handle-callback-err
        error: (_error, _message, count) => {
          if (count && count <= 3) {
            return lsp.ErrorAction.Continue;
          }

          // throw error and let user decide what to do next
          this._setStatus({
            state: 'error',
            message:
              'Connection to flow server is erroring. Shutting down server. See the output for more information.',
            actions: [
              {
                title: 'Go to output',
                command: () => {
                  this.commands.runShowOutputCommand();
                },
              },
              {
                title: 'Restart Client',
                command: () => {
                  this.commands.runRestartClientCommand();
                },
              },
            ],
          });

          return lsp.ErrorAction.Shutdown;
        },

        // Can we find the reason here somehow ??
        // For now adding 'Go to output' action. Maybe 'flow lsp' connection logged some error in output panel.
        closed: () => {
          this._setStatus({
            state: 'error',
            message:
              'Connection to flow server got closed. See the output for more information.',
            actions: [
              {
                title: 'Go to output',
                command: () => {
                  this.commands.runShowOutputCommand();
                },
              },
              {
                title: 'Restart Client',
                command: () => {
                  this.commands.runRestartClientCommand();
                },
              },
            ],
          });

          // DoNotRestart: user will decide what to do
          return lsp.CloseAction.DoNotRestart;
        },
      },

      // NOTE: we want client rootPath & cwd to be flowconfigPath
      // vscode-languageclient uses clientOptions.workspaceFolder (if passed) for cwd and rootPath
      // so passing dummy workspaceFolder with flowconfigDir as uri
      workspaceFolder: {
        name: flowconfigPath,
        index: 0,
        uri: vscode.Uri.file(flowconfigDir),
      },

      // NOTE: not part of official vscode-languageclient
      extensions: {
        status: {
          onChange: (status) => {
            if (status && status.state === 'error') {
              status.actions = [
                {
                  title: 'Restart Client',
                  command: () => {
                    this.commands.runRestartClientCommand();
                  },
                },
                // NOTE: action 'Restart Client' handle more error cases compared to
                // flow 'restart' action so removing flow restart action
                ...(status.actions || []).filter(
                  (action) => action.title.toLowerCase() !== 'restart',
                ),
              ];
            }
            this._setStatus(status);
          },
        },
        typeCoverage: {
          onChange: (coverage) => {
            this._statusBarWidget.setCoverage(coverage);
          },
          command: this.commands.toggleCoverage,
          defaultShowUncovered: config.coverage.showUncovered,
          diagnosticSeverity: config.coverage.diagnosticSeverity,
        },
      },
    };

    // Create the language client and start the client.
    const client = new lsp.LanguageClient(
      'flow',
      'Flow',
      serverOptions,
      clientOptions,
    );

    return client;
  }

  _disposeClient(): Promise<void> {
    return Promise.resolve(this._client ? this._client.stop() : undefined);
  }

  _createLogger(config: Config): Logger {
    const { _options } = this;
    return new Logger(this.getName(), _options.outputChannel, config.logLevel);
  }

  _handleInitError: (err: Error) => void = (err) => {
    const msg = `Failed to start flow\n${err.toString()}`;
    this._logger.error(msg);
    this._setStatus({
      state: 'error',
      message: `${msg}`,
      actions: [
        {
          title: 'Retry',
          command: () => {
            this._reinit();
          },
        },
      ],
    });
  };

  _setStatus(status: null | lsp.StatusReport) {
    this._statusBarWidget.setStatus(status);
    if (status && status.state === 'error') {
      this.commands.runShowStatusCommand();
    }
  }

  logDebugInfo() {
    this._logger.info(
      JSON.stringify(
        {
          flowconfig: this._options.flowconfigPath,
          flow: this._statusBarWidget.getFlowInfo(),
          serverStatus: this._statusBarWidget.getStatus(),
        },
        null,
        2,
      ),
    );
  }
}
