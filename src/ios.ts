import { DeviceBase } from './device';
import { asyncExec } from './asyncExec';
import { packageName, uniqueId } from './main';
import { appPath, versionBundle } from './downloadBuilds';
import { logLine } from './logLine';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

export class iOS extends DeviceBase {
  private logEmitter: EventEmitter;
  private logProcess: ChildProcess | null;
  private readFile = promisify(fs.readFile);
  private rm = promisify(fs.rm);

  constructor(id: string) {
    super(id)
    this.id = id;
    this.logProcess = null;
    this.logEmitter = new EventEmitter();
  }

  Start(): void {
    this.startExecution();
  }

  Stop(): void {
    this.stopLogProcess();
    this.logout(`Execution Completed`, 'Execution completed for iOS device');
  }

  async GetResultFiles(): Promise<void> {
    try {
      this.logout('Completed Routines',`Will start copying files`);
      //Create target directory
      const resultsName = `Results_${versionBundle}`
      const targetPath = path.join(__dirname, '../', `${resultsName}`, uniqueId, this.id);
      fs.mkdirSync(targetPath, { recursive: true });

      //Fetch ProfilingAutomationFilesNames text file
      const fileName = 'Documents/ProfilingAutomationFilesNames.txt'
      const filePath = `${this.id}/${fileName}`;
      await this.runShellCode(`ios-deploy --bundle_id ${packageName} --download=${fileName} --to ${this.id} --id ${this.id}`);

      //Fetch all the file names from ProfilingAutomationFilesNames text file
      const filesList = await this.readFile(filePath, 'utf8');
      const filesNames = filesList.split(/\r\n|\n/);
      //Download all the files to targetPath
      for (const file of filesNames) {
        if (file !== '') {
          this.logout('File Copying',`[${file}]`);
          await this.runShellCode(`ios-deploy --bundle_id ${packageName} --download="Documents/${file}" --to ${targetPath} --id ${this.id}`);
          this.logout('File Copied',`[${file}]`);
          fs.renameSync(path.join(targetPath, 'Documents', file), path.join(targetPath, file))
        }
      }

      //Delete the directory
      await this.rm(this.id, { recursive: true, force: true });
      await this.rm(path.join(targetPath, 'Documents'), { recursive: true, force: true });
    } catch (err) {
      console.error(`Error reading JSON file: ${err}`);
    }
  }

  Log(data: string): void {
    super.Log(data);
  }

  sendData(chunk: string) {
    this.Log(chunk);
  }

  async startExecution() {
    try {
      //Install the app
      const uninstallResult = await this.runShellCode(`xcrun devicectl device install app --device ${this.id} "${appPath()}"`)
      this.logout("Uninstall", uninstallResult);

      //Launch the app
      const launchResult = await this.runShellCode(`xcrun devicectl device process launch --terminate-existing --device ${this.id} ${packageName} profilingAutomation true`)
      this.logout("Launch App", launchResult);

      //Start logging
      this.startLogProcess();
    } catch (ex) {
      console.log(ex);
    }
  }

  async runShellCode(shellCommand: string): Promise<string> {
    let outString = "";
    try {
      outString = await asyncExec(shellCommand);
      if (!outString || outString.trim() === '')
        outString = shellCommand;
    } catch (err) {
      console.error('Something went wrong:', err);
    }

    return outString;
  }

  private startLogCapture() {
    const idevicesyslog = spawn('idevicesyslog', ['-u', this.id], { stdio: 'pipe' });

    idevicesyslog.stdout?.on('data', (data) => {
      const logLine = data.toString().trim();
      this.logEmitter.emit('log', logLine);
    });

    this.logProcess = idevicesyslog;
  }

  private startLogProcess() {
    if (!this.logProcess) {
      this.startLogCapture();
      this.logEmitter.on('log', (logLine: string) => {
        this.sendData(logLine);
      });

      process.on('SIGINT', () => {
        this.stopLogProcess();
      });
    }
  }

  private stopLogProcess() {
    if (this.logProcess) {
      this.logEmitter.removeAllListeners('log');
      this.logProcess.kill('SIGINT');
      this.logProcess = null;
    }
  }

  private logout(logHeader: string, log: string) {
    logLine(this.id, logHeader, log)
  }
}