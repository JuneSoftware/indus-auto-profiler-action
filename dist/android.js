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
exports.Android = void 0;
const adbkit_1 = require("@u4/adbkit");
const main_1 = require("./main");
const device_1 = require("./device");
const devices_1 = require("./devices");
const downloadBuilds_1 = require("./downloadBuilds");
const asyncExec_1 = require("./asyncExec");
const logLine_1 = require("./logLine");
const fs = require("fs");
const path = require("path");
class Android extends device_1.DeviceBase {
    constructor(id) {
        super(id);
        this.id = id;
    }
    Start() {
        this.startExecution();
    }
    Stop() {
        this.conn.end();
        this.logout(`Execution Completed`, 'Execution completed for Android device');
    }
    GetResultFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logout('Completed Routines', `Will start copying files`);
                //Create target directory
                const resultsName = `Results_${downloadBuilds_1.versionBundle}`;
                const targetPath = path.join(__dirname, '../', `${resultsName}`, main_1.uniqueId, this.id);
                fs.mkdirSync(targetPath, { recursive: true });
                //Fetch ProfilingAutomationFilesNames text file
                const filesList = yield this.runShellCode(`cat storage/emulated/0/Android/data/${main_1.packageName}/files/ProfilingAutomationFilesNames.txt`);
                const filesNames = filesList.split(/\r\n|\n/);
                //Download all the files to targetPath
                for (const file of filesNames) {
                    if (file !== '') {
                        this.logout('File Copying', `[${file}]`);
                        yield this.runADBCode(`pull "storage/emulated/0/Android/data/${main_1.packageName}/files/${file}" ${targetPath}`);
                        this.logout('File Copied', `[${file}]`);
                    }
                }
            }
            catch (ex) {
                console.error('Error writing to the file:', ex);
            }
        });
    }
    Log(data) {
        super.Log(data);
    }
    startExecution() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const devices = yield devices_1.client.listDevices();
                this.device = devices.find(dev => dev.id === this.id);
                const deviceClient = this.device.getClient();
                //Uninstall the package
                const uninstallResult = yield deviceClient.uninstall(main_1.packageName);
                this.logout("Uninstall", uninstallResult);
                //Install the apk
                const installResult = yield deviceClient.install(downloadBuilds_1.apkPath);
                this.logout("Install", installResult);
                //Grant required permissions to the APK
                const setPermissionResult = yield this.runShellCode(`pm grant ${main_1.packageName} android.permission.RECORD_AUDIO`);
                this.logout("Set Permission", setPermissionResult);
                //Force close app if running
                const closeAppResult = yield this.runShellCode(`am force-stop ${main_1.packageName}`);
                this.logout("Close App", closeAppResult);
                //Launch the application
                const launcAppResult = yield this.runShellCode(`am start -n "${main_1.packageName}/com.unity3d.player.UnityPlayerActivity" -e profilingAutomation true`);
                this.logout("Launch App", launcAppResult);
                //Read device logs
                this.readLogs();
            }
            catch (err) {
                console.error('Something went wrong:', err);
            }
        });
    }
    runShellCode(shellCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            let outString = "";
            try {
                const stream = yield this.device.getClient().shell(shellCommand);
                const output = yield adbkit_1.Adb.util.readAll(stream);
                outString = output.toString().trim();
                if (!outString || outString.trim() === '')
                    outString = shellCommand;
            }
            catch (err) {
                console.error(`[${this.id}]:`, err);
            }
            return outString;
        });
    }
    runADBCode(shellCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            let outString = "";
            try {
                outString = yield (0, asyncExec_1.asyncExec)(`adb -s ${this.id} ${shellCommand}`);
                if (!outString || outString.trim() === '')
                    outString = shellCommand;
            }
            catch (err) {
                console.error('Something went wrong:', err);
            }
            return outString;
        });
    }
    readLogs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.device.getClient().shell(`logcat -c`);
                this.conn = yield this.device.getClient().shell(`logcat`);
                this.conn.on('data', (chunk) => {
                    this.Log(chunk.toString());
                });
                process.on('SIGINT', () => {
                    this.conn.end();
                });
            }
            catch (err) {
                console.error('Something went wrong:', err);
            }
        });
    }
    logout(logHeader, log) {
        (0, logLine_1.logLine)(this.id, logHeader, log);
    }
}
exports.Android = Android;
