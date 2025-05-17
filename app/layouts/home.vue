<template>
  <div>
    <header class="px-10 py-4 flex justify-between items-center">
      <div>
        <NuxtLink to="/" class="text-xl font-bold">My App</NuxtLink>
      </div>
      <UserMenu />
    </header>
    
    <main class="px-10 py-20 text-center">
      <slot />
      <Footer />
      <div class="text-sm mx-auto mt-5 text-center opacity-25">
        [Home Layout]
      </div>
    </main>
  </div>
</template>
