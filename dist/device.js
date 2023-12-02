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
exports.DeviceBase = void 0;
const logLine_1 = require("./logLine");
class DeviceBase {
    constructor(id) {
        this.id = id;
        this.executionCompleted = false;
        this.timeoutObject = undefined;
    }
    Timeout() {
        this.timeoutObject = setTimeout(() => {
            //Execution timeout
            this.executionCompleted = true;
        }, 1800000);
    }
    Log(data) {
        if (data.includes("[ProfilingAutomation]")) {
            (0, logLine_1.logLine)(this.id, 'Device Log', data.split('[ProfilingAutomation]')[1]);
        }
        if (data.includes("[ProfilingAutomation] Completed Automation")) {
            this.ProfilingFinished();
        }
    }
    ProfilingFinished() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.GetResultFiles();
                (0, logLine_1.logLine)(this.id, 'Received JSON', 'Successful');
                if (this.timeoutObject !== undefined)
                    clearTimeout(this.timeoutObject);
                this.executionCompleted = true;
            }
            catch (ext) {
                console.error(`Error reading JSON file: ${ext}`);
            }
        });
    }
}
exports.DeviceBase = DeviceBase;
