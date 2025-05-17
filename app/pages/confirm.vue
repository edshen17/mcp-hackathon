<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const message = ref('Confirming your account...')

onMounted(async () => {
  try {
    // Handle the OAuth callback
    const { error } = await client.auth.getUser()
    
    if (error) throw error
    
    message.value = 'Account confirmed successfully! Redirecting...'
    
    // Redirect to home after successful confirmation
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }
  catch (error: any) {
    console.error('Error confirming account:', error)
    message.value = 'Failed to confirm your account. Please try again or contact support.'
  }
  finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div max-w-md mx-auto text-center>
    <h1 text-3xl font-bold mb-6>Account Confirmation</h1>
    
    <div v-if="isLoading" class="flex justify-center mb-4">
      <div class="w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
    
    <p>{{ message }}</p>
    
    <div v-if="!isLoading && !user" mt-6>
      <NuxtLink 
        to="/log-in" 
        class="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go to Login
      </NuxtLink>
    </div>
  </div>
</template>