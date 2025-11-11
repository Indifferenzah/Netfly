import { supabase } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create discussions table
    const { error: discussionsError } = await supabase
      .from('discussions')
      .select('*')
      .limit(1);

    if (discussionsError && discussionsError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createDiscussionsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS discussions (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createDiscussionsError) {
        console.error('Error creating discussions table:', createDiscussionsError);
        return res.status(500).json({ error: 'Failed to create discussions table' });
      }
    }

    // Create replies table
    const { error: repliesError } = await supabase
      .from('replies')
      .select('*')
      .limit(1);

    if (repliesError && repliesError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createRepliesError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS replies (
            id SERIAL PRIMARY KEY,
            discussion_id INTEGER REFERENCES discussions(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createRepliesError) {
        console.error('Error creating replies table:', createRepliesError);
        return res.status(500).json({ error: 'Failed to create replies table' });
      }
    }

    res.status(200).json({ message: 'Tables created successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
