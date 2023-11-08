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
exports.iOS = void 0;
const device_1 = require("./device");
const asyncExec_1 = require("./asyncExec");
const main_1 = require("./main");
const downloadBuilds_1 = require("./downloadBuilds");
const child_process_1 = require("child_process");
const events_1 = require("events");
const util_1 = require("util");
const path = require("path");
const fs = require("fs");
class iOS extends device_1.DeviceBase {
    constructor(id) {
        super(id);
        this.readFile = (0, util_1.promisify)(fs.readFile);
        this.unlink = (0, util_1.promisify)(fs.unlink);
        this.rmdir = (0, util_1.promisify)(fs.rmdir);
        this.id = id;
        this.logProcess = null;
        this.logEmitter = new events_1.EventEmitter();
    }
    Start() {
        this.startExecution();
    }
    Stop() {
        this.stopLogProcess();
        console.log(`Completed on ${this.id}`);
    }
    GetResultFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //Create target directory
                const resultsName = `Results_${downloadBuilds_1.versionBundle}`;
                const targetPath = path.join(__dirname, '../', `${resultsName}`, main_1.uniqueId, this.id);
                if (!fs.existsSync(resultsName)) {
                    fs.mkdirSync(resultsName);
                }
                fs.mkdirSync(targetPath, { recursive: true });
                //Fetch ProfilingAutomationFilesNames text file
                const fileName = 'Documents/ProfilingAutomationFilesNames.txt';
                const filePath = `${this.id}/${fileName}`;
                yield this.runShellCode(`ios-deploy --bundle_id ${main_1.packageName} --download=${fileName} --to ${this.id} --id ${this.id}`);
                //Fetch all the file names from ProfilingAutomationFilesNames text file
                const filesList = yield this.readFile(filePath, 'utf8');
                const filesNames = filesList.split(/\r\n|\n/);
                //Download all the files to targetPath
                for (const file of filesNames) {
                    if (file !== '') {
                        yield this.runShellCode(`ios-deploy --bundle_id ${main_1.packageName} --download="Documents/${file}" --to ${targetPath} --id ${this.id}`);
                        fs.renameSync(path.join(targetPath, 'Documents', file), path.join(targetPath, file));
                    }
                }
                //Delete the ProfilingAutomationFilesNames file
                yield this.unlink(filePath);
                //Delete the directory
                const dirPath = path.dirname(filePath);
                yield this.rmdir(dirPath);
                yield this.rmdir(this.id);
                yield this.rmdir(path.join(targetPath, 'Documents'));
            }
            catch (err) {
                console.error(`Error reading JSON file: ${err}`);
            }
        });
    }
    Log(data) {
        super.Log(data);
    }
    sendData(chunk) {
        this.Log(chunk);
    }
    startExecution() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //Install the app
                const uninstallResult = yield this.runShellCode(`xcrun devicectl device install app --device ${this.id} "${(0, downloadBuilds_1.appPath)()}"`);
                this.logout("Uninstall", uninstallResult);
                //Launch the app
                const launchResult = yield this.runShellCode(`xcrun devicectl device process launch --terminate-existing --device ${this.id} ${main_1.packageName} profilingAutomation true`);
                this.logout("Launch App", launchResult);
                //Start logging
                this.startLogProcess();
            }
            catch (ex) {
                console.log(ex);
            }
        });
    }
    runShellCode(shellCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            let outString = "";
            try {
                outString = yield (0, asyncExec_1.asyncExec)(shellCommand);
                if (!outString || outString.trim() === '')
                    outString = shellCommand;
            }
            catch (err) {
                console.error('Something went wrong:', err);
            }
            return outString;
        });
    }
    startLogCapture() {
        var _a;
        const idevicesyslog = (0, child_process_1.spawn)('idevicesyslog', ['-u', this.id], { stdio: 'pipe' });
        (_a = idevicesyslog.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            const logLine = data.toString().trim();
            this.logEmitter.emit('log', logLine);
        });
        this.logProcess = idevicesyslog;
    }
    startLogProcess() {
        if (!this.logProcess) {
            this.startLogCapture();
            this.logEmitter.on('log', (logLine) => {
                this.sendData(logLine);
            });
            process.on('SIGINT', () => {
                this.stopLogProcess();
            });
        }
    }
    stopLogProcess() {
        if (this.logProcess) {
            this.logEmitter.removeAllListeners('log');
            this.logProcess.kill('SIGINT');
            this.logProcess = null;
        }
    }
    logout(logHeader, log) {
        console.log(`[${this.id}] ${logHeader}: ${log}`);
    }
}
exports.iOS = iOS;
