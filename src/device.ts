import { logLine } from "./logLine";

export abstract class DeviceBase {
    id: string;
    executionCompleted: boolean;
    timeoutObject: any;

    constructor(id: string) {
        this.id = id;
        this.executionCompleted = false;
        this.timeoutObject = undefined;
    }

    abstract Start(): void;
    abstract Stop(): void;
    abstract GetResultFiles(): Promise<void>;

    public Timeout() {
        this.timeoutObject = setTimeout(() => {
            //Execution timeout
            this.executionCompleted = true;
        }, 14400000);
    }

    public Log(data: string): void {
        if (data.includes("[ProfilingAutomation]")){
            logLine(this.id, 'Device Log', data.split('[ProfilingAutomation]')[1]);
        }
        if (data.includes("[ProfilingAutomation] Completed Automation")) {
            this.ProfilingFinished();
        }
    }

    private async ProfilingFinished() {
        try {
            await this.GetResultFiles();
            logLine(this.id, 'Received JSON', 'Successful');
            if (this.timeoutObject !== undefined)
                clearTimeout(this.timeoutObject);
            this.executionCompleted = true;
        } catch (ext) {
            console.error(`Error reading JSON file: ${ext}`);
        }
    }
}
