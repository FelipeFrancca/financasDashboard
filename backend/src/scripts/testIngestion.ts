
import { IngestionService } from '../services/ingestionService';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function testIngestion() {
    const imagePath = 'C:/Users/Kronn/.gemini/antigravity/brain/b3b46739-0353-432c-a7de-64057c73258d/uploaded_image_1764815902335.jpg';

    if (!fs.existsSync(imagePath)) {
        console.error(`Image not found at path: ${imagePath}`);
        return;
    }

    console.log(`Reading image from: ${imagePath}`);
    const fileBuffer = fs.readFileSync(imagePath);

    // Instantiate service
    const ingestionService = new IngestionService();

    try {
        console.log('Starting processing...');
        const result = await ingestionService.processFile(fileBuffer, 'image/jpeg');

        console.log('---------------------------------------------------');
        console.log('EXTRACTION SUCCESSFUL!');
        console.log('---------------------------------------------------');
        console.log(JSON.stringify(result, null, 2));
        console.log('---------------------------------------------------');
    } catch (error: any) {
        const errorLog = `
Error message: ${error.message}
Error code: ${error.code}
Error details: ${JSON.stringify(error.details, null, 2)}
Error stack: ${error.stack}
        `;
        fs.writeFileSync(path.join(__dirname, '../../error.log'), errorLog);
        console.error('Error written to error.log');
    }
}

testIngestion();
