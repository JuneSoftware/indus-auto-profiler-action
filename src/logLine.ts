import * as chalk from 'chalk';

export async function logLine(id: string, logHeader: string, log: string) {
  console.log(chalk.blue(`[${id}]`) + chalk.yellow(`[${getDateTimeString()}] `) + `${logHeader}: ${log}`)
}

export async function log(id: string, logHeader: string, log: string) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(chalk.blue(`[${id}]`) + chalk.yellow(`[${getDateTimeString()}] `) + `${logHeader}: ${log}`);
}

function getDateTimeString(): string {
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

  return `${hours}:${minutes}:${seconds}`;
}