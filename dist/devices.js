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
exports.getDevices = exports.client = void 0;
const adbkit_1 = require("@u4/adbkit");
const asyncExec_1 = require("./asyncExec");
const android_1 = require("./android");
const ios_1 = require("./ios");
const downloadBuilds_1 = require("./downloadBuilds");
const fs = require("fs");
const path = require("path");
exports.client = adbkit_1.Adb.createClient();
function getDevices() {
    return __awaiter(this, void 0, void 0, function* () {
        const devicesConnected = [];
        try {
            const devices = yield exports.client.listDevices();
            //Fetch Android devices if APK exists
            if (fs.existsSync(downloadBuilds_1.apkPath)) {
                for (const device of devices) {
                    const canConnect = device.type === 'device';
                    console.log(`[Android] UUID: ${device.id}, Pairing State: ${device.type}, Connected: ${canConnect}`);
                    if (canConnect) {
                        devicesConnected.push(new android_1.Android(device.id));
                    }
                }
            }
            //Fetch iOS devices if its a Mac and APP exists
            if (process.platform === 'darwin' && (0, downloadBuilds_1.appPath)().trim().length > 0 && fs.existsSync((0, downloadBuilds_1.appPath)())) {
                //Fetch iOS devices if its a Mac and APP exists
                var filePath = path.join(__dirname, '../', 'iPhones.json');
                var result = yield (0, asyncExec_1.asyncExec)(`xcrun devicectl list devices -j ${filePath}`);
                if (result) {
                    var iPhoneJsonFile = fs.readFileSync(filePath, 'utf-8');
                    fs.unlinkSync(filePath);
                    const data = JSON.parse(iPhoneJsonFile);
                    //Extract device UUID and pairing state
                    const iDevices = data.result.devices;
                    for (const device of iDevices) {
                        const uuid = device.hardwareProperties.udid;
                        const pairingState = device.connectionProperties.pairingState;
                        const canConnect = pairingState === 'paired';
                        console.log(`[iOS] UUID: ${uuid}, Pairing State: ${pairingState}, Connected: ${canConnect}`);
                        if (canConnect) {
                            devicesConnected.push(new ios_1.iOS(uuid));
                        }
                    }
                }
            }
        }
        catch (err) {
            console.error('Something went wrong:', err);
        }
        return devicesConnected;
    });
}
exports.getDevices = getDevices;
