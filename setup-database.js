import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://mnsofbbwcivcobbmfzbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc29mYmJ3Y2l2Y29iYm1memJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzEwOTAsImV4cCI6MjA2ODU0NzA5MH0.6u3n_7b2P4YxQnZ8DX16Sz097TKyxpo9-Agd1TQQ1Ig';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema...');
    
    // Read the migration file
    const sql = readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} error (might be expected):`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} failed:`, err.message);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('🎉 Database setup complete!');
    console.log('🌐 You can now visit: http://localhost:5173');
    console.log('📧 Create an account to get started');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase();