import { serverSupabaseClient } from '#supabase/server'

// Define a basic structure for your users table
interface User {
  id: string // or number, depending on your schema
  email: string
  created_at: string
}

// Define a basic Database type
interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: User // Or a partial type if some fields are optional/generated
        Update: Partial<User> // Or a partial type
      }
    }
    Functions: {
      create_users_table: void // Define if you need to type its args/return
    }
  }
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const body = await readBody(event)

  try {
    // Check if the users table exists
    const { error: tableCheckError } = await client
      .from('users')
      .select('id')
      .limit(1)

    // If table doesn't exist, create it
    if (tableCheckError && tableCheckError.message.includes('relation "users" does not exist')) {
      const { error: createTableError } = await client.rpc('create_users_table')
      if (createTableError)
        throw createTableError
    }

    // Insert the user record
    const { data, error } = await client
      .from('users')
      .insert({
        id: body.id,
        email: body.email,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error)
      throw error

    return { success: true, user: data[0] }
  }
  catch (error: any) {
    console.error('Error creating user:', error)
    return { success: false, error: error.message }
  }
})
