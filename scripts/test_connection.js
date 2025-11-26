#!/usr/bin/env node
/**
 * Test Firebolt connection with Node.js SDK
 */

const { Firebolt } = require('firebolt-sdk');

const CLIENT_ID = "REDACTED_CLIENT_ID";
const CLIENT_SECRET = "REDACTED_CLIENT_SECRET";
const ACCOUNT_NAME = "se-demo-account";
const DATABASE_NAME = "late_materialization_demo";
const ENGINE_NAME = "ecommerceengine";

console.log("=".repeat(80));
console.log("Testing Firebolt Connection with Node.js SDK");
console.log("=".repeat(80));
console.log(`Account: ${ACCOUNT_NAME}`);
console.log(`Database: ${DATABASE_NAME}`);
console.log(`Engine: ${ENGINE_NAME}`);
console.log("=".repeat(80));

async function test() {
    try {
        console.log("\n[1/3] Initializing Firebolt client...");
        const firebolt = Firebolt();
        console.log("✓ Client initialized");
        
        console.log("\n[2/3] Connecting to database...");
        const connection = await firebolt.connect({
            account: ACCOUNT_NAME,
            database: DATABASE_NAME,
            engineName: ENGINE_NAME,
            auth: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }
        });
        console.log("✓ Connection established");
        
        console.log("\n[3/3] Testing query execution...");
        const statement = await connection.execute("SELECT 1 as test");
        const { data } = await statement.fetchResult();
        console.log(`✓ Query executed successfully: ${JSON.stringify(data)}`);
        
        console.log("\n" + "=".repeat(80));
        console.log("✓ ALL TESTS PASSED - Node.js SDK connection is working!");
        console.log("=".repeat(80));
        
    } catch (error) {
        console.log("\n" + "=".repeat(80));
        console.log("✗ CONNECTION FAILED");
        console.log("=".repeat(80));
        console.log(`Error: ${error.message}`);
        console.log("\nFull error:");
        console.error(error);
        process.exit(1);
    }
}

test();

