import fs from 'fs';
import path from 'path';

export function loadJsonlData(filePath: string) {
    const fullPath = path.resolve(__dirname, filePath);  // Kreira apsolutnu putanju

    const data = [];
    
    // Čitanje fajla liniju po liniju
    const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
    
    for (const line of lines) {
        if (line.trim()) {  // Ignoriše prazne linije
            try {
                data.push(JSON.parse(line));  // Parsiranje svake linije kao JSON objekta
            } catch (error) {
                console.error(`Greška u parsiranju linije: ${line}`, error);
            }
        }
    }
    
    return data;
}
