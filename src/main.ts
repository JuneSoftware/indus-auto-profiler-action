import { DeviceBase } from "./device";
import { getDevices } from "./devices";
import { downloadBuilds, versionBundle } from "./downloadBuilds";
import { logLine } from "./logLine";
import * as core from '@actions/core';
import * as path from 'path';

export const packageName = core.getInput('packageName');
//Create unique ID based on data time
const currentTimestamp = new Date().toISOString().replace(/[-T:.]/g, '');
const randomIdentifier = Math.floor(Math.random() * 1000);
export const uniqueId = `${currentTimestamp}${randomIdentifier}`;

main();

async function main() {
  //Step 1: Download builds
  await downloadBuilds();

  //Step 2: Fetch all the connected devices
  const devices = await getDevices();

  //Step 3: Start execution on all the devices
  devices.forEach(d => {
    d.Timeout();
    d.Start();
  });

  //Step 4: Wait for execution to be completed on all the connected devices
  waitForAllDevicesToComplete(devices).then(() => {
    allDevicesCompleted(devices);
    const resultsName = `Results_${versionBundle}`
    const targetPath = path.join(__dirname, '../', `${resultsName}`);
    core.setOutput('resultsPath', targetPath);
    logLine('None', 'Execution Completed', "All devices have completed their execution.");
  }).catch((err) => {
    console.error("An error occurred while waiting for devices to complete:", err);
  });
}

async function waitForAllDevicesToComplete(devices: DeviceBase[]) {
  const completionPromises = devices.map(async (device) => {
    while (!device.executionCompleted) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  await Promise.all(completionPromises);
}

function allDevicesCompleted(devices: DeviceBase[]) {
  devices.forEach(d => {
    d.Stop();
  });
}