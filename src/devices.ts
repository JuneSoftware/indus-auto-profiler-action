import { Adb } from '@u4/adbkit';
import { asyncExec } from './asyncExec';
import { DeviceBase } from './device';
import { Android } from './android';
import { iOS } from './ios';
import { apkPath, appPath } from './downloadBuilds';
import * as fs from 'fs';

export const client = Adb.createClient();

export async function getDevices(): Promise<DeviceBase[]> {
    const devicesConnected: DeviceBase[] = [];

    try {
        const devices = await client.listDevices();

        //Fetch Android devices if APK exists
        if (fs.existsSync(apkPath)) {
            for (const device of devices) {
                devicesConnected.push(new Android(device.id));
            }
        }

        //Fetch iOS devices if its a Mac and APP exists
        if (process.platform === 'darwin' && appPath().trim().length > 0 && fs.existsSync(appPath())) {
            const result = await asyncExec('idevice_id');
            const identifiers = result.split('\n').map(line => line.split(/\s+/)[0]).filter(Boolean);
            identifiers.forEach((identifier) => devicesConnected.push(new iOS(identifier)));
        }
    } catch (err) {
        console.error('Something went wrong:', err);
    }

    return devicesConnected;
}