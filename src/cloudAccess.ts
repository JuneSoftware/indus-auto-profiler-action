import { Storage } from '@google-cloud/storage';
import extract = require("extract-zip");
import * as path from 'path';
import * as fs from 'fs';
const core = require('@actions/core');

export const apkPath = path.join(__dirname, '../', 'App.apk');
export function appPath() {
    return tryGetAppPath(path.join(__dirname, '../'));
}

const bucketName = core.getInput('bucketName');
const uploadBucketName = core.getInput('uploadBucketName');
const uploadDestination = core.getInput('uploadDestination');
const versionCode = core.getInput('versionCode');
const versionNumber = core.getInput('versionNumber');
const credentialsString = core.getInput('credentials');
export const versionBundle = `${versionNumber}_${versionCode}`;

const zipPath = path.join(__dirname, '../', 'App.zip');
const storageConfig = { credentials: JSON.parse(credentialsString) }
const storage = new Storage(storageConfig)

export async function downloadBuilds() {
    try {
        const apkLink = await fetchLink('Android/Android_Ver', '.apk');
        const appLink = await fetchLink('iOS/iOS_Ver', '.app.zip');
            
        if (apkLink.trim().length > 0) {
            const downloadAPKOptions = { destination: apkPath }
            await storage.bucket(bucketName).file(apkLink).download(downloadAPKOptions);
            console.log('APK downloaded')
        } else {
            console.log('APK didnt downloaded')
        }
        if (appLink.trim().length > 0) {
            const downloadAPPOptions = { destination: zipPath }
            await storage.bucket(bucketName).file(appLink).download(downloadAPPOptions);
            await extract(zipPath, { dir: path.join(__dirname, '../') })
            console.log('APP downloaded')
        } else {
            console.log('APP didnt downloaded')
        }
    } catch (ex) {
        console.log(ex);
    }
}

export async function uploadResults(path: string) {
    try {
        console.log('Results upload started');
        const uploadOptions = { destination: uploadDestination }
        await storage.bucket(uploadBucketName).upload(path, uploadOptions);
        console.log('Results upload completed');
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