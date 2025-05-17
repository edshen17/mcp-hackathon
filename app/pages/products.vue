<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

const products = ref([
  {
    id: 1,
    name: 'Product 1',
    price: 99.99,
    description: 'This is a great product',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: 2,
    name: 'Product 2',
    price: 149.99,
    description: 'Another amazing product',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: 3,
    name: 'Product 3',
    price: 199.99,
    description: 'Premium quality product',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: 4,
    name: 'Product 4',
    price: 249.99,
    description: 'Exclusive limited edition',
    image: 'https://via.placeholder.com/150',
  },
])
</script>

<template>
  <div>
    <h1 text-3xl font-bold mb-6>Products</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div 
        v-for="product in products" 
        :key="product.id" 
        class="border rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <img :src="product.image" :alt="product.name" class="w-full h-40 object-cover">
        <div class="p-4">
          <h3 text-lg font-semibold>{{ product.name }}</h3>
          <p text-green-600 font-bold mt-1>${{ product.price.toFixed(2) }}</p>
          <p text-gray-600 mt-2>{{ product.description }}</p>
          <button 
            mt-4 w-full p-2 rounded bg-blue-500 text-white
            hover:bg-blue-600
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>