import { Storage } from '@google-cloud/storage';
import { logLine, log } from './logLine';
import extract = require("extract-zip");
import * as path from 'path';
import * as fs from 'fs';
const core = require('@actions/core');

export const apkPath = path.join(__dirname, '../', 'App.apk');
export function appPath() {
    return tryGetAppPath(path.join(__dirname, '../'));
}

const bucketName = core.getInput('bucketName');
const versionCode = core.getInput('versionCode');
const versionNumber = core.getInput('versionNumber');
const credentialsString = core.getInput('credentials');
export const versionBundle = `${versionNumber}_${versionCode}`;

const zipPath = path.join(__dirname, '../', 'App.zip');
const storageConfig = { credentials:JSON.parse(credentialsString) }
const storage = new Storage(storageConfig)

export async function downloadBuilds() {
    try {
        const apkLink = await fetchLink('Android/Android_Ver', '.apk');
        const appLink = await fetchLink('iOS/iOS_Ver', '.app.zip');

        if (apkLink.trim().length > 0) {
            await downloadFileWithProgress('APK', bucketName, apkLink, apkPath);
        } else {
            logLine('None', 'APK download', 'Failed')
        }
        if (appLink.trim().length > 0) {
            await downloadFileWithProgress('APP', bucketName, appLink, zipPath);
            await extract(zipPath, { dir: path.join(__dirname, '../') })
            logLine('None', 'APP extraction', 'Completed')
        } else {
            logLine('None', 'APP download', 'Failed')
        }
    } catch (ex) {
        console.log(ex);
    }
}

async function fetchLink(prefix: string, suffix: string): Promise<string> {
    let link = ''
    try {
        const options = {
            prefix: `${prefix}(${versionBundle})`,
        };

        // Lists files in the bucket, filtered by a prefix
        const [files] = await storage.bucket(bucketName).getFiles(options);
        files.forEach(file => {
            if (file.name.includes(`${versionBundle}${suffix}`)) {
                link = file.name;
            }
        });
    } catch (ex) {
        console.log(ex);
    }

    return link;
}

function tryGetAppPath(rootDir: string): string {
    const substring = '.app';
    const queue: string[] = [rootDir];

    while (queue.length > 0) {
        const currentDir = queue.shift();
        if (currentDir === undefined) {
            continue; // Skip undefined currentDir
        }
        const files = fs.readdirSync(currentDir);

        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Check if the folder name contains the substring
                if (file.includes(substring)) {
                    return filePath; // Return the path when a match is found
                }
                queue.push(filePath);
            }
        }
    }

    return ''; // Return empty if the substring is not found
}

async function downloadFileWithProgress(tag: string, bucketName: string, srcFilename: string, destFilename: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(srcFilename);
        const updateInterval = 500;
        const stream = file.createReadStream();
        const localWriteStream = fs.createWriteStream(destFilename);

        let downloadedBytes = 0;
        let lastUpdate = Date.now();

        const updateProgress = () => {
            log('None', `${tag} download`, `Downloaded ${(downloadedBytes / (1024 * 1024)).toFixed(2)}mb \r`);
            lastUpdate = Date.now();
        };

        stream.on('data', (chunk: Buffer) => {
            downloadedBytes += chunk.length;
            const now = Date.now();
            if (now - lastUpdate > updateInterval) {
                updateProgress();
            }
        });

        stream.on('error', (error: Error) => {
            console.error('Error downloading file:', error);
            reject(error);
        });

        stream.on('end', () => {
            if (Date.now() - lastUpdate >= 500) {
                updateProgress();
            }
            log('None', `${tag} download`, 'Completed');
            console.log('');
            resolve();
        });

        stream.pipe(localWriteStream);
    });
}