import { supabase } from './db.js';

async function createTable() {
  // Try to insert a dummy row to check if table exists
  const { error } = await supabase
    .from('registration_codes')
    .insert({
      email: 'dummy@example.com',
      code: '123456'
    });

  if (error && error.code === 'PGRST205') {
    // Table doesn't exist, we need to create it manually in Supabase dashboard
    console.log('Table does not exist. Please create the table manually in Supabase dashboard with the following SQL:');
    console.log(`
      CREATE TABLE registration_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes')
      );
    `);
  } else if (error && error.code === '23505') {
    // Unique constraint violation (table exists, dummy email already exists)
    console.log('Table exists');
  } else if (error) {
    console.error('Error:', error);
  } else {
    console.log('Table exists and dummy row inserted');
  }
}

createTable();
