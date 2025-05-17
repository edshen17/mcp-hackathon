<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  available_sizes: string[];
  available_colors: string[];
}

interface CartItem {
  product_id: string;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
  price_at_add: number;
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const products = ref<Product[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Store user selections for each product
const selectedSizes = ref<Record<string, string>>({})
const selectedColors = ref<Record<string, string>>({})
const quantities = ref<Record<string, number>>({})

// Fetch products from Supabase
async function fetchProducts() {
  try {
    loading.value = true
    error.value = null
    
    const { data, error: supabaseError } = await supabase
      .from('products')
      .select('*')
    
    if (supabaseError) throw supabaseError
    
    products.value = data
  } catch (err: any) {
    console.error('Error fetching products:', err)
    error.value = err.message || 'Failed to load products'
  } finally {
    loading.value = false
  }
}

// Add to cart function with purposely introduced bug
async function addToCart(product: Product) {
  if (!user.value) {
    console.error('User must be logged in')
    return
  }
  
  // Bug: We're getting the selected size and color but NOT passing them to the cart item
  const selectedSize = selectedSizes.value[product.id]
  const selectedColor = selectedColors.value[product.id]
  const quantity = quantities.value[product.id] || 1
  
  console.log('Selected size:', selectedSize)
  console.log('Selected color:', selectedColor)
  
  // Create the cart item with the bug - NOT including the selected size and color
  const cartItem: CartItem = {
    product_id: product.id,
    quantity: quantity,
    // BUG: These are purposely set to null instead of using the selected values
    selected_size: null, // Should be selectedSize
    selected_color: null, // Should be selectedColor
    price_at_add: product.base_price
  }
  
  try {
    const { error: insertError } = await supabase
      .from('user_cart_items')
      .insert([{
        user_id: user.value.id,
        ...cartItem
      }])
    
    if (insertError) throw insertError
    
    // Clear selections after adding to cart
    selectedSizes.value[product.id] = ''
    selectedColors.value[product.id] = ''
    quantities.value[product.id] = 1
    
    alert('Product added to cart')
  } catch (err: any) {
    console.error('Error adding to cart:', err)
    alert('Failed to add product to cart')
  }
}

// Initialize selections and fetch products on component mount
onMounted(() => {
  fetchProducts()
  
  // Set default quantities to 1
  products.value.forEach(product => {
    quantities.value[product.id] = 1
  })
})
</script>

<template>
  <div>
    <h1 text-3xl font-bold mb-6>Products</h1>
    
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 p-4 rounded text-red-700 mb-6">
      {{ error }}
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="product in products" 
        :key="product.id" 
        class="border border-gray-600 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-gray-800"
      >
        <img :src="product.image_url" :alt="product.name" class="w-full h-64 object-cover">
        <div class="p-4">
          <h3 class="text-xl font-semibold text-white">{{ product.name }}</h3>
          <p class="text-green-400 font-bold mt-1">${{ product.base_price.toFixed(2) }}</p>
          <p class="text-gray-300 mt-2 h-16 overflow-hidden">{{ product.description }}</p>
          
          <!-- Product variations -->
          <div class="mt-4 space-y-3">
            <!-- Size selection -->
            <div v-if="product.available_sizes && product.available_sizes.length > 0">
              <label class="block text-sm font-medium text-white mb-1">Size:</label>
              <select 
                v-model="selectedSizes[product.id]"
                class="block w-full rounded bg-gray-700 text-white border-gray-600 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="" disabled class="bg-gray-700 text-white">Select a size</option>
                <option v-for="size in product.available_sizes" :key="size" :value="size" class="bg-gray-700 text-white">
                  {{ size }}
                </option>
              </select>
            </div>
            
            <!-- Color selection -->
            <div v-if="product.available_colors && product.available_colors.length > 0">
              <label class="block text-sm font-medium text-white mb-1">Color:</label>
              <select 
                v-model="selectedColors[product.id]"
                class="block w-full rounded bg-gray-700 text-white border-gray-600 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="" disabled class="bg-gray-700 text-white">Select a color</option>
                <option v-for="color in product.available_colors" :key="color" :value="color" class="bg-gray-700 text-white">
                  {{ color }}
                </option>
              </select>
            </div>
            
            <!-- Quantity selection -->
            <div>
              <label class="block text-sm font-medium text-white mb-1">Quantity:</label>
              <input 
                type="number" 
                v-model="quantities[product.id]" 
                min="1" 
                max="10"
                class="block w-full rounded bg-gray-700 text-white border-gray-600 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button 
            @click="addToCart(product)"
            class="mt-4 w-full p-2 rounded bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!selectedSizes[product.id] || !selectedColors[product.id]"
          >
            Add to Cart
          </button>
          <p v-if="!selectedSizes[product.id] || !selectedColors[product.id]" class="mt-2 text-xs text-yellow-400">
            Please select size and color
          </p>
        </div>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-if="!loading && !error && products.length === 0" class="text-center py-12">
      <p text-lg text-gray-600>No products available</p>
    </div>
  </div>
</template>