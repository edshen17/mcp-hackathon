<template>
  <div>
    <header class="px-10 py-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
      <div>
        <NuxtLink to="/" class="text-xl font-bold">My App</NuxtLink>
      </div>
      <UserMenu />
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
