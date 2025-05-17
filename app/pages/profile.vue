<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

const user = useSupabaseUser()
const userStore = useUserStore()
const client = useSupabaseClient()

// Form fields for updating profile
const displayName = ref(userStore.savedName)
const updateMessage = ref('')
const isUpdating = ref(false)
const userProfile = ref<any>(null)

// Load user profile on mount
onMounted(async () => {
  try {
    console.log('Loading profile page, ensuring user profile exists')
    
    // Call our server endpoint to ensure a profile exists
    const result = await $fetch('/api/ensure-profile', {
      method: 'GET'
    })
    
    console.log('Profile ensure result:', result)
    
    if (result.success && result.user) {
      userProfile.value = result.user
      
      // If we have a name in the profile, use it
      if (result.user.name) {
        displayName.value = result.user.name
        userStore.setNewName(result.user.name)
      }
      
      if (result.action === 'created') {
        console.log('Created new user profile')
        updateMessage.value = 'Your profile has been created! You can update your display name below.'
      }
    } else {
      console.error('Error ensuring user profile:', result.error)
    }
  } 
  catch (error) {
    console.error('Failed to load user profile:', error)
  }
})

async function updateProfile() {
  try {
    isUpdating.value = true
    updateMessage.value = ''
    
    // Update the name in the database
    const { error } = await client
      .from('users')
      .update({ 
        name: displayName.value 
      })
      .eq('id', user.value?.id)
      
    if (error) throw error
    
    // Update the name in the store
    userStore.setNewName(displayName.value)
    
    updateMessage.value = 'Profile updated successfully!'
  }
  catch (error: any) {
    updateMessage.value = error.message || 'Failed to update profile'
  }
  finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div max-w-md mx-auto>
    <h1 text-3xl font-bold mb-6>Your Profile</h1>
    
    <div v-if="user" class="mb-8 p-4 border rounded text-left">
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>User ID:</strong> {{ user.id }}</p>
      <p><strong>Last Sign In:</strong> {{ new Date(user.last_sign_in_at || '').toLocaleString() }}</p>
    </div>
    
    <form @submit.prevent="updateProfile" class="space-y-4 text-left">
      <div>
        <label for="displayName" block mb-1>Display Name</label>
        <input 
          id="displayName" 
          v-model="displayName" 
          type="text" 
          required
          w-full p-2 border rounded
        >
      </div>
      
      <div v-if="updateMessage" 
        :class="{'bg-green-50 text-green-600': !updateMessage.includes('Failed'), 
                'bg-red-50 text-red-500': updateMessage.includes('Failed')}" 
        class="p-4 rounded">
        {{ updateMessage }}
      </div>
      
      <div>
        <button 
          type="submit" 
          w-full p-2 bg-blue-500 text-white rounded
          hover:bg-blue-600
          :disabled="isUpdating"
        >
          <span v-if="isUpdating">Updating...</span>
          <span v-else>Update Profile</span>
        </button>
      </div>
    </form>
  </div>
</template>