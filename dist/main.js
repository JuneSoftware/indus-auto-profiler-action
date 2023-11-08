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
exports.uniqueId = exports.packageName = void 0;
const devices_1 = require("./devices");
const cloudAccess_1 = require("./cloudAccess");
const core = require('@actions/core');
const path = require("path");
exports.packageName = core.getInput('packageName');
//Create unique ID based on data time
const currentTimestamp = new Date().toISOString().replace(/[-T:.]/g, '');
const randomIdentifier = Math.floor(Math.random() * 1000);
exports.uniqueId = `${currentTimestamp}${randomIdentifier}`;
main();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //Step 1: Download builds
        yield (0, cloudAccess_1.downloadBuilds)();
        //Step 2: Fetch all the connected devices
        const devices = yield (0, devices_1.getDevices)();
        //Step 3: Start execution on all the devices
        devices.forEach(d => {
            d.Timeout();
            d.Start();
        });
        //Step 4: Wait for execution to be completed on all the connected devices
        waitForAllDevicesToComplete(devices).then(() => {
            allDevicesCompleted(devices);
            const resultsName = `Results_${cloudAccess_1.versionBundle}`;
            const targetPath = path.join(__dirname, '../', `${resultsName}`);
            (0, cloudAccess_1.uploadResults)(targetPath);
            console.log("All devices have completed their execution.");
        }).catch((err) => {
            console.error("An error occurred while waiting for devices to complete:", err);
        });
    });
}
function waitForAllDevicesToComplete(devices) {
    return __awaiter(this, void 0, void 0, function* () {
        const completionPromises = devices.map((device) => __awaiter(this, void 0, void 0, function* () {
            while (!device.executionCompleted) {
                yield new Promise(resolve => setTimeout(resolve, 100));
            }
        }));
        yield Promise.all(completionPromises);
    });
}
function allDevicesCompleted(devices) {
    devices.forEach(d => {
        d.Stop();
    });
}
