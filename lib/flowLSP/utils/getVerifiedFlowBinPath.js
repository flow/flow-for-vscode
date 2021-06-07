/*@flow*/
import Logger from './Logger';
import importFresh from './importFresh';
import getExtensionPath from './getExtentionPath';
// $FlowFixMe Flow doesn't recognize the fs/promises node module
import { readFile, readdir, access } from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
// $FlowFixMe Flow doesn't recognize crypto.verify
import { verify, createHash } from 'crypto';
import { window } from 'vscode';

function getFlowBinDirPrefixForPlatform(): null | string {
    return process.platform === 'darwin'
                ? 'flow-osx-v' :
            process.platform === 'linux' && process.arch === 'x64'
                ? 'flow-linux64-v' :
            process.platform === 'win32' &&  process.arch === 'x64'
                ? 'flow-win64-v' :
            null;
}

async function getFlowBinPath(flowBinModulePath: string, dirPrefix: string): Promise<string> {
    const flowBinModuleContents = await readdir(flowBinModulePath);
    const flowBinDirName = flowBinModuleContents.find(x => x.startsWith(dirPrefix));
    if (!flowBinDirName) {
        throw new Error(`Failed to find anything starting with ${dirPrefix} in ${flowBinModulePath}`);
    }
    const flowBinDir = path.join(flowBinModulePath, flowBinDirName)
    const flowBinDirContents = await readdir(flowBinDir);
    const flowBinName = flowBinDirContents.find(x => x.startsWith('flow'));
    if (!flowBinName) {
        throw new Error(`Failed to find flow binary in ${flowBinDir}`);
    }
    const flowBin = path.join(flowBinDir, flowBinName);
    return flowBin
}

function getShasum(shasums: string, dirPrefix: string): string {
    const shasum_lines = shasums.split(/\r?\n/);
    const shasum_line = shasum_lines.find(line => line.includes(dirPrefix));
    if (!shasum_line) {
        throw new Error(`Failed to find SHASUM256.txt line containing ${dirPrefix}`);
    }
    return shasum_line.slice(0, 64);
}

export default async function(flowBinModulePath: string, logger: Logger): Promise<string> {
    await access(flowBinModulePath);
    let successfullyAccessedShasumsSignature = false;
    try {
        // first, verify integrity of SHASUM256.txt by checking its signature
        const shasums = await readFile(path.join(flowBinModulePath, 'SHASUM256.txt'));
        const shasumsSignatureBase64 = await readFile(path.join(flowBinModulePath, 'SHASUM256.txt.sign'), { encoding: 'ascii' });
        successfullyAccessedShasumsSignature = true;
        const shasumsSignature = Buffer.from(shasumsSignatureBase64, 'base64');
        const publicKey = await readFile(path.join(getExtensionPath(), 'signing.pem'));
        if (!verify('sha256', shasums, publicKey, shasumsSignature)) {
            throw new Error('Failed to verify SHASUM256.txt against public key');
        }

        // successfully verified SHASUM256.txt, now we can use it to verify the flow binary
        const dirPrefix = getFlowBinDirPrefixForPlatform();
        if (!dirPrefix) {
            throw new Error(`Failed to determine correct binary for platform ${process.platform} and arch ${process.arch}`);
        }
        const flowBinPath = await getFlowBinPath(flowBinModulePath, dirPrefix);
        if (!flowBinPath) {
            throw new Error('Failed to determine path to flow binary');
        }
        const hash = createHash('sha256');
        const flowBinReadStream = createReadStream(flowBinPath);
        const flowBinHashPromise = new Promise((resolve, reject) => {
            flowBinReadStream.on('end', () => resolve(hash.digest('hex')));
            flowBinReadStream.on('error', reject);
        });
        flowBinReadStream.pipe(hash);
        const flowBinHash = await flowBinHashPromise;
        const shasum = getShasum(shasums.toString(), dirPrefix);
        if (flowBinHash !== shasum) {
            throw new Error(
                `Hash of ${flowBinPath} does not match hash from SHASUM256.txt:\n` +
                `Hash of flow binary: ${flowBinHash}\n` +
                `Hash from SHASUM256.txt: ${shasum}`
            );
        }
        return flowBinPath;
    } catch (err) {
        logger.error(`Error when verifying flow-bin in ${flowBinModulePath}:\n${err.message}`);
        // failed to verify SHASUM256.txt; ask the user whether to proceed anyway

        const versionHint =
            successfullyAccessedShasumsSignature ?
            '' :
            'Your version of the flow-bin node module is too old to verify; this can be resolved by upgrading to a newer version. ';

        const quickPickOptions = {
            title: `Unable to verify the integrity of ${flowBinModulePath}. ${versionHint}Proceed anyway?`
        };
        const quickPickItems = [
            {
                label: `Don't try to use ${flowBinModulePath}`,
                proceedAnyay: false,
            },
            {
                label: `Try to use ${flowBinModulePath} anyway`,
                proceedAnyay: true,
            },
        ]

        const userSelection = await window.showQuickPick(quickPickItems, quickPickOptions);

        if (userSelection && userSelection.proceedAnyay) {
            // user can change version of module or remove module while plugin is running
            // so always importFresh
            return importFresh(flowBinModulePath);
        } else {
            throw new Error('User chose not to use unverified flow-bin');
        }
    }
}

