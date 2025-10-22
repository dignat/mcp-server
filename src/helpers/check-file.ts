import fs from 'fs/promises';

export async function checkFile(filePath: string): Promise<boolean> {
    let flag: boolean = false
    try {
        (await fs.stat(filePath)).isFile();
        flag = true
    } catch (error) {
        console.error(error);
    }
   return flag
}