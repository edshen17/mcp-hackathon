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

const route = useRoute()

// Redirect if user is already logged in
watchEffect(() => {
  if (user.value) {
    // Check if there's a redirect parameter
    const redirectPath = route.query.redirect
    
    if (redirectPath && typeof redirectPath === 'string') {
      router.push(redirectPath)
    }
    else {
      router.push('/products')
    }
  }
})

async function login() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const { error } = await client.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error)
      throw error

    // Authentication successful - redirect handled by watchEffect
  }
  catch (error: any) {
    errorMessage.value = error.message || 'Failed to sign in'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div mx-auto max-w-md>
    <h1 text-3xl font-bold mb-6>
      Log In
    </h1>

    <div v-if="errorMessage" text-red-500 mb-4 p-4 rounded bg-red-50>
      {{ errorMessage }}
    </div>

    <form class="space-y-4" @submit.prevent="login">
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
          placeholder="Password"
        >
      </div>

      <div>
        <button
          type="submit"

          text-white p-2 rounded bg-blue-500 w-full hover:bg-blue-600
          :disabled="isLoading"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Log In</span>
        </button>
      </div>
    </form>

    <div mt-4 text-center>
      <p>
        Don't have an account? <NuxtLink to="/sign-up" class="text-blue-500 hover:underline">
          Sign Up
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
