<template>
  <div>
    <header class="px-10 py-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
      <div>
        <NuxtLink to="/" class="text-xl font-bold">My App</NuxtLink>
      </div>
      <div class="flex items-center space-x-4">
        <NuxtLink v-if="useUserStore().isLoggedIn" to="/cart" class="p-2 relative text-gray-700 hover:text-blue-500">
          <!-- Shopping Cart Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </NuxtLink>
        <UserMenu />
      </div>
    </header>
    
    <main class="px-10 py-20 text-center">
      <slot />
      <Footer />
      <div class="text-sm mx-auto mt-5 text-center opacity-25">
        [Default Layout]
      </div>
    </main>
  </div>
</template>
