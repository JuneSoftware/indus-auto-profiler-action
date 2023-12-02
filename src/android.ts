import { Adb, Device } from '@u4/adbkit';
import { packageName, uniqueId } from './main';
import { DeviceBase } from './device';
import { client } from './devices';
import { apkPath, versionBundle } from './downloadBuilds';
import { asyncExec } from './asyncExec';
import { logLine } from './logLine'
import * as fs from 'fs';
import * as path from 'path';

export class Android extends DeviceBase {
    private conn: any;
    private device: any;

    constructor(id: string) {
        super(id);
        this.id = id;
    }

    Start(): void {
        this.startExecution();
    }

    Stop(): void {
        this.conn.end();
        this.logout(`Execution Completed`, 'Execution completed for Android device');
    }

    async GetResultFiles(): Promise<void> {
        try {
            this.logout('Completed Routines',`Will start copying files`);
            //Create target directory
            const resultsName = `Results_${versionBundle}`
            const targetPath = path.join(__dirname, '../', `${resultsName}`, uniqueId, this.id);
            fs.mkdirSync(targetPath, { recursive: true });

            //Fetch ProfilingAutomationFilesNames text file
            const filesList = await this.runShellCode(`cat storage/emulated/0/Android/data/${packageName}/files/ProfilingAutomationFilesNames.txt`);
            const filesNames = filesList.split(/\r\n|\n/);
            //Download all the files to targetPath
            for (const file of filesNames) {
                if (file !== '') {
                    this.logout('File Copying',`[${file}]`);
                    await this.runADBCode(`pull "storage/emulated/0/Android/data/${packageName}/files/${file}" ${targetPath}`);
                    this.logout('File Copied',`[${file}]`);
                }
            }
        } catch (ex) {
            console.error('Error writing to the file:', ex);
        }
    }

    Log(data: string): void {
        super.Log(data);
    }

    async startExecution() {
        try {
            const devices = await client.listDevices();
            this.device = devices.find(dev => dev.id === this.id) as Device;
            const deviceClient = this.device.getClient();

            //Uninstall the package
            const uninstallResult = await deviceClient.uninstall(packageName);
            this.logout("Uninstall", uninstallResult);

            //Install the apk
            const installResult = await deviceClient.install(apkPath);
            this.logout("Install", installResult);

            //Grant required permissions to the APK
            const setPermissionResult = await this.runShellCode(`pm grant ${packageName} android.permission.RECORD_AUDIO`);
            this.logout("Set Permission", setPermissionResult);

            //Force close app if running
            const closeAppResult = await this.runShellCode(`am force-stop ${packageName}`);
            this.logout("Close App", closeAppResult);

            //Launch the application
            const launcAppResult = await this.runShellCode(`am start -n "${packageName}/com.unity3d.player.UnityPlayerActivity" -e profilingAutomation true`);
            this.logout("Launch App", launcAppResult);

            //Read device logs
            this.readLogs();

        } catch (err) {
            console.error('Something went wrong:', err);
        }
    }

    async runShellCode(shellCommand: string): Promise<string> {
        let outString = "";
        try {
            const stream = await this.device.getClient().shell(shellCommand);
            const output = await Adb.util.readAll(stream);
            outString = output.toString().trim();
            if (!outString || outString.trim() === '')
                outString = shellCommand;
        } catch (err) {
            console.error(`[${this.id}]:`, err);
        }

        return outString;
    }

    async runADBCode(shellCommand: string): Promise<string> {
        let outString = "";
        try {
            outString = await asyncExec(`adb -s ${this.id} ${shellCommand}`);
            if (!outString || outString.trim() === '')
                outString = shellCommand;
        } catch (err) {
            console.error('Something went wrong:', err);
        }

        return outString;
    }

    async readLogs() {
        try {
            await this.device.getClient().shell(`logcat -c`)
            this.conn = await this.device.getClient().shell(`logcat`)
            this.conn.on('data', (chunk: string) => {
                this.Log(chunk.toString());
            });

            process.on('SIGINT', () => {
                this.conn.end();
            });
        } catch (err) {
            console.error('Something went wrong:', err);
        }
    }

    private logout(logHeader: string, log: string) {
        logLine(this.id, logHeader, log)
    }
}
