import fs from 'fs';

export const loadJsonlData = (filePath: fs.PathOrFileDescriptor) => {
    const data = [];
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    
    for (const line of lines) {
        if (line.trim()) {
            data.push(JSON.parse(line)); 
        }
    }
    
    return data;
};
