import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://jcpbjuadwpmwzrqjmxdb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcGJqdWFkd3Btd3pycWpteGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDY1NTEsImV4cCI6MjA3ODM4MjU1MX0._9vmCV27eWbFvsYHgRjok1aApd0YHOMKYtZxktudm0k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username
      }
    }
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function onAuthStateChange(callback) {
  supabase.auth.onAuthStateChange(callback)
}
