import * as chalk from 'chalk';

export async function logLine(id: string, logHeader: string, log: string) {
    var time = new Date();
    var hours = time.getHours().toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    })
    var minutes = time.getMinutes().toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    })
    var seconds = time.getSeconds().toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    })
    console.log(chalk.blue(`[${id}]`) + chalk.yellow(`[${hours}:${minutes}:${seconds}] `) + `${logHeader}: ${log}`)
}