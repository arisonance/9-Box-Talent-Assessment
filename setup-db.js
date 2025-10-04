#!/usr/bin/env node

// Simple script to set up Supabase database using REST API
import fs from 'fs';
import https from 'https';

// Read environment variables
const SUPABASE_URL = 'https://mnsofbbwcivcobbmfzbe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc29mYmJ3Y2l2Y29iYm1memJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzEwOTAsImV4cCI6MjA2ODU0NzA5MH0.6u3n_7b2P4YxQnZ8DX16Sz097TKyxpo9-Agd1TQQ1Ig';

// Test basic connection
function testConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mnsofbbwcivcobbmfzbe.supabase.co',
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Supabase connection successful!');
          resolve(true);
        } else {
          console.log('❌ Connection failed:', data);
          reject(new Error(`Status: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Check if tables exist
function checkTables() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mnsofbbwcivcobbmfzbe.supabase.co',
      path: '/rest/v1/organizations?limit=1',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Tables exist and are accessible!');
          resolve(true);
        } else {
          console.log('⚠️  Tables may not exist or need setup:', res.statusCode, data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Table check error:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🔧 Setting up Supabase Database...\n');
  
  try {
    console.log('1. Testing connection...');
    await testConnection();
    
    console.log('\n2. Checking if tables exist...');
    const tablesExist = await checkTables();
    
    if (!tablesExist) {
      console.log('\n⚠️  Database setup needed!');
      console.log('\nPlease run the SQL in QUICK_SETUP.sql in your Supabase dashboard:');
      console.log('1. Go to https://supabase.com/dashboard/project/mnsofbbwcivcobbmfzbe');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of QUICK_SETUP.sql');
      console.log('4. Run the SQL to create all tables and policies\n');
    } else {
      console.log('\n🎉 Database is ready!');
      console.log('Your 9-Box Talent Assessment app should now work at http://localhost:5173\n');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

main();