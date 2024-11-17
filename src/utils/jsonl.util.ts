import fs from 'fs';

export const loadJsonlData = (fileResolvedPath: string) => {
    const data = [];

    const lines = fs.readFileSync(fileResolvedPath, 'utf-8').split('\n');
    for (const line of lines) {
        if (line.trim()) {
            data.push(JSON.parse(line));
        }
    }

    return data;
};
