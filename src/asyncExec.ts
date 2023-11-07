import { exec as childProcessExec } from 'child_process';

export const asyncExec = async (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    childProcessExec(command, (error, stdout, stderr) => {
      if (error !== null) {
        reject(error);
      } else if (stderr !== '') {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
};