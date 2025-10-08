import fs from 'fs/promises';
export async function checkFile(filePath) {
    let flag = false;
    try {
        (await fs.stat(filePath)).isFile();
        flag = true;
    }
    catch (error) {
        console.error(error);
    }
    return flag;
}
