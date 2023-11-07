"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadBuilds = exports.versionBundle = exports.appPath = exports.apkPath = void 0;
const storage_1 = require("@google-cloud/storage");
const extract = require("extract-zip");
const path = require("path");
const fs = require("fs");
const core = require('@actions/core');
exports.apkPath = path.join(__dirname, '../', 'App.apk');
function appPath() {
    return tryGetAppPath(path.join(__dirname, '../'));
}
exports.appPath = appPath;
const bucketName = core.getInput('bucketName');
const versionCode = core.getInput('versionCode');
const versionNumber = core.getInput('versionNumber');
const credentialsString = core.getInput('credentials');
exports.versionBundle = `${versionNumber}_${versionCode}`;
const zipPath = path.join(__dirname, '../', 'App.zip');
const storageConfig = { credentials: JSON.parse(credentialsString) };
const storage = new storage_1.Storage(storageConfig);
const downloadAPKOptions = { destination: exports.apkPath };
const downloadAPPOptions = { destination: zipPath };
function downloadBuilds() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const apkLink = yield fetchLink('Android/Android_Ver', '.apk');
            const appLink = yield fetchLink('iOS/iOS_Ver', '.app.zip');
            if (apkLink.trim().length > 0) {
                yield storage.bucket(bucketName).file(apkLink).download(downloadAPKOptions);
                console.log('APK downloaded');
            }
            else {
                console.log('APK didnt downloaded');
            }
            if (appLink.trim().length > 0) {
                yield storage.bucket(bucketName).file(appLink).download(downloadAPPOptions);
                yield extract(zipPath, { dir: path.join(__dirname, '../') });
                console.log('APP downloaded');
            }
            else {
                console.log('APP didnt downloaded');
            }
        }
        catch (ex) {
            console.log(ex);
        }
    });
}
exports.downloadBuilds = downloadBuilds;
function fetchLink(prefix, suffix) {
    return __awaiter(this, void 0, void 0, function* () {
        let link = '';
        try {
            const options = {
                prefix: `${prefix}(${exports.versionBundle})`,
            };
            // Lists files in the bucket, filtered by a prefix
            const [files] = yield storage.bucket(bucketName).getFiles(options);
            files.forEach(file => {
                if (file.name.includes(`${exports.versionBundle}${suffix}`)) {
                    link = file.name;
                }
            });
        }
        catch (ex) {
            console.log(ex);
        }
        return link;
    });
}
function tryGetAppPath(rootDir) {
    const substring = '.app';
    const queue = [rootDir];
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
