// Migration script to transfer data from JSON files to Vercel KV
// Run this with: node scripts/migrate-to-kv.mjs

import { kv } from '@vercel/kv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const FILES = ['users', 'profiles', 'posts', 'chat', 'votes'];

async function migrate() {
    console.log('🚀 Starting migration from JSON files to Vercel KV...\n');

    if (!process.env.KV_REST_API_TOKEN) {
        console.error('❌ Error: KV_REST_API_TOKEN environment variable is not set');
        console.error('Please set up Vercel KV and configure environment variables');
        process.exit(1);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const fileName of FILES) {
        const filePath = join(DATA_DIR, `${fileName}.json`);

        if (!existsSync(filePath)) {
            console.log(`⚠️  Skipping ${fileName}.json (file not found)`);
            continue;
        }

        try {
            const fileContent = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            console.log(`📤 Migrating ${fileName}.json...`);
            await kv.set(fileName, data);
            
            console.log(`✅ Successfully migrated ${fileName}.json`);
            successCount++;
        } catch (error) {
            console.error(`❌ Error migrating ${fileName}.json:`, error.message);
            errorCount++;
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${FILES.length}`);

    if (successCount > 0) {
        console.log('\n🎉 Migration completed! You can now deploy to Vercel.');
        console.log('💡 Tip: Verify your data in the Vercel KV dashboard');
    }
}

migrate().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
