<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// Redirect if user is already logged in
watchEffect(() => {
  if (user.value) {
    router.push('/products')
  }
})

async function signUp() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const { data, error } = await client.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        // Skip email verification
        emailRedirectTo: `${window.location.origin}/products`,
        data: {
          email_confirmed: true
        }
      },
    })

    if (error)
      throw error

    // Auto sign in after registration
    if (data && data.user) {
      // First, try to create a user in the users table
      try {
        // Insert the user into the users table directly
        const { error: insertError } = await client
          .from('users')
          .insert({
            id: data.user.id,
            email: email.value,
            name: email.value.split('@')[0],
          })
          
        if (insertError) {
          console.warn('Could not insert user into users table:', insertError)
        }
        else {
          console.log('User successfully added to users table')
        }
      } 
      catch (e) {
        console.error('Error creating user profile:', e)
      }
      
      // Sign in the user
      const { error: signInError } = await client.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      
      if (signInError)
        throw signInError
        
      // Redirect to products page
      router.push('/products')
    }
  }
  catch (error: any) {
    errorMessage.value = error.message || 'Failed to sign up'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div mx-auto max-w-md>
    <h1 text-3xl font-bold mb-6>
      Sign Up
    </h1>

    <div v-if="errorMessage" text-red-500 mb-4 p-4 rounded bg-red-50>
      {{ errorMessage }}
    </div>

    <form class="space-y-4" @submit.prevent="signUp">
      <div>
        <label for="email" mb-1 text-left block>Email</label>
        <input
          id="email"
          v-model="email"
          type="email"

          required p-2 border rounded w-full
          placeholder="Email address"
        >
      </div>

      <div>
        <label for="password" mb-1 text-left block>Password</label>
        <input
          id="password"
          v-model="password"
          type="password"

          required p-2 border rounded w-full
          placeholder="Password (minimum 6 characters)"
        >
      </div>

      <div>
        <button
          type="submit"

          text-white p-2 rounded bg-blue-500 w-full hover:bg-blue-600
          :disabled="isLoading"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Sign Up</span>
        </button>
      </div>
    </form>

    <div mt-4 text-center>
      <p>
        Already have an account? <NuxtLink to="/log-in" class="text-blue-500 hover:underline">
          Log In
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
