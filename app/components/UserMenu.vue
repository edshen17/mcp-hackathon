<script setup lang="ts">
const userStore = useUserStore()
const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

async function handleSignOut() {
  await userStore.signOut()
  closeMenu()
  // Redirect to login page after sign out
  navigateTo('/log-in')
}
</script>

<template>
  <div class="relative">
    <!-- Not logged in - show login/signup buttons -->
    <div v-if="!userStore.isLoggedIn" class="flex gap-2">
      <NuxtLink 
        to="/log-in" 
        class="px-4 py-2 text-blue-500 hover:underline"
      >
        Log in
      </NuxtLink>
      <NuxtLink 
        to="/sign-up" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Sign up
      </NuxtLink>
    </div>
    
    <!-- Logged in - show user menu -->
    <div v-else>
      <button 
        @click="toggleMenu" 
        class="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          {{ userStore.savedName.charAt(0).toUpperCase() }}
        </div>
        <span>{{ userStore.savedName }}</span>
        <div class="w-4 h-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
      </button>
      
      <!-- Dropdown menu -->
      <div 
        v-if="isMenuOpen" 
        class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-lg z-10"
      >
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <p class="font-medium">{{ userStore.savedName }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ userStore.userEmail }}</p>
        </div>
        <div class="p-2">
          <NuxtLink 
            to="/profile" 
            class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Profile
          </NuxtLink>
          <button 
            @click="handleSignOut" 
            class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>