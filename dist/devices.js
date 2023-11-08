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
const cloudAccess_1 = require("./cloudAccess");
const fs = require("fs");
exports.client = adbkit_1.Adb.createClient();
function getDevices() {
    return __awaiter(this, void 0, void 0, function* () {
        const devicesConnected = [];
        try {
            const devices = yield exports.client.listDevices();
            //Fetch Android devices if APK exists
            if (fs.existsSync(cloudAccess_1.apkPath)) {
                for (const device of devices) {
                    devicesConnected.push(new android_1.Android(device.id));
                }
            }
            //Fetch iOS devices if its a Mac and APP exists
            if (process.platform === 'darwin' && (0, cloudAccess_1.appPath)().trim().length > 0 && fs.existsSync((0, cloudAccess_1.appPath)())) {
                const result = yield (0, asyncExec_1.asyncExec)('idevice_id');
                const identifiers = result.split('\n').map(line => line.split(/\s+/)[0]).filter(Boolean);
                identifiers.forEach((identifier) => devicesConnected.push(new ios_1.iOS(identifier)));
            }
        }
        catch (err) {
            console.error('Something went wrong:', err);
        }
        return devicesConnected;
    });
}
exports.getDevices = getDevices;
