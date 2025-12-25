import fs from 'fs/promises';

export async function checkFile(filePath: string): Promise<boolean> {
    let flag: boolean = false
    try {
        (await fs.stat(filePath)).isFile();
        flag = true
    } catch (error) {
        console.error(`We need to handle the error, by creating the file ${error}`);
        return false;
    }
   return flag
}