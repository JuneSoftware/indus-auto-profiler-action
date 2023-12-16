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
exports.logLine = void 0;
const chalk = require("chalk");
function logLine(id, logHeader, log) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk.blue(`[${id}]`) + chalk.yellow(`[${getDateTimeString()}] `) + `${logHeader}: ${log}`);
    });
}
exports.logLine = logLine;
function getDateTimeString() {
    var time = new Date();
    var hours = time.getHours().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    var minutes = time.getMinutes().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    var seconds = time.getSeconds().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    return `${hours}:${minutes}:${seconds}`;
}
