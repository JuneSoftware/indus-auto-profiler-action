import { Adb } from '@u4/adbkit';
import { asyncExec } from './asyncExec';
import { DeviceBase } from './device';
import { Android } from './android';
import { iOS } from './ios';
import { apkPath, appPath } from './downloadBuilds';
import * as fs from 'fs';
import * as path from 'path';

export const client = Adb.createClient();

export async function getDevices(): Promise<DeviceBase[]> {
    const devicesConnected: DeviceBase[] = [];

    try {
        const devices = await client.listDevices();

        //Fetch Android devices if APK exists
        if (fs.existsSync(apkPath)) {
            for (const device of devices) {
                const canConnect = device.type === 'device';
                console.log(`[Android] UUID: ${device.id}, Pairing State: ${device.type}, Connected: ${canConnect}`);
                if (canConnect) {
                    devicesConnected.push(new Android(device.id));
                }
            }
        }

        //Fetch iOS devices if its a Mac and APP exists
        if (process.platform === 'darwin' && appPath().trim().length > 0 && fs.existsSync(appPath())) {
            //Fetch iOS devices if its a Mac and APP exists
            var filePath = path.join(__dirname, '../', 'iPhones.json');
            var result = await asyncExec(`xcrun devicectl list devices -j ${filePath}`);
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
                        devicesConnected.push(new iOS(uuid))
                    }
                }
            }
        }
    } catch (err) {
        console.error('Something went wrong:', err);
    }

    return devicesConnected;
}