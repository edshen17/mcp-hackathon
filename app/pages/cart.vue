<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

interface CartItem {
  id: string
  product_id: string
  quantity: number
  selected_size: string | null
  selected_color: string | null
  price_at_add: number
  added_at: string
  product: {
    name: string
    image_url: string
    available_sizes: string[]
    available_colors: string[]
  }
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const cart = ref<CartItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Fetch cart items with product details
async function fetchCart() {
  if (!user.value)
    return

  try {
    loading.value = true
    error.value = null

    const { data, error: supabaseError } = await supabase
      .from('user_cart_items')
      .select(`
        *,
        product:products(name, image_url, available_sizes, available_colors)
      `)
      .eq('user_id', user.value.id)

    if (supabaseError)
      throw supabaseError

    cart.value = data
  }
  catch (err: any) {
    console.error('Error fetching cart:', err)
    error.value = err.message || 'Failed to load cart'
  }
  finally {
    loading.value = false
  }
}

// Remove item from cart
async function removeFromCart(itemId: string) {
  try {
    const { error: deleteError } = await supabase
      .from('user_cart_items')
      .delete()
      .eq('id', itemId)

    if (deleteError)
      throw deleteError

    // Update cart after removal
    cart.value = cart.value.filter(item => item.id !== itemId)
  }
  catch (err: any) {
    console.error('Error removing item:', err)
    alert('Failed to remove item from cart')
  }
}

// Calculate total price
const totalPrice = computed(() => {
  return cart.value.reduce((total, item) => {
    return total + (item.price_at_add * item.quantity)
  }, 0)
})

// Format date for display
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

// Fetch cart on component mount
onMounted(() => {
  fetchCart()
})
</script>

<template>
  <div class="mx-auto pb-12 max-w-5xl">
    <h1 text-3xl font-bold mb-6>
      Your Cart
    </h1>

    <div v-if="loading" class="py-12 flex justify-center">
      <div class="border-b-2 border-t-2 border-blue-500 rounded-full h-12 w-12 animate-spin" />
    </div>

    <div v-else-if="error" class="text-red-700 mb-6 p-4 rounded bg-red-100">
      {{ error }}
    </div>

    <div v-else-if="cart.length === 0" class="py-12 text-center">
      <p text-lg text-gray-600 mb-4>
        Your cart is empty
      </p>
      <nuxt-link to="/products" class="text-white px-4 py-2 rounded bg-blue-500 hover:bg-blue-600">
        Browse Products
      </nuxt-link>
    </div>

    <div v-else>
      <!-- Cart items -->
      <div class="rounded-lg bg-white shadow overflow-hidden">
        <table class="min-w-full divide-gray-200 divide-y">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="text-xs text-gray-500 font-medium tracking-wider px-6 py-3 text-left uppercase">
                Product
              </th>
              <th scope="col" class="text-xs text-gray-500 font-medium tracking-wider px-6 py-3 text-left uppercase">
                Details
              </th>
              <th scope="col" class="text-xs text-gray-500 font-medium tracking-wider px-6 py-3 text-left uppercase">
                Price
              </th>
              <th scope="col" class="text-xs text-gray-500 font-medium tracking-wider px-6 py-3 text-left uppercase">
                Quantity
              </th>
              <th scope="col" class="text-xs text-gray-500 font-medium tracking-wider px-6 py-3 text-left uppercase">
                Total
              </th>
              <th scope="col" class="text-xs text-gray-500 font-medium tracking-wider px-6 py-3 text-left uppercase">
                Added
              </th>
              <th scope="col" class="px-6 py-3 relative">
                <span class="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-gray-200 divide-y">
            <tr v-for="item in cart" :key="item.id">
              <!-- Product image and name -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-16 w-16">
                    <img :src="item.product.image_url" :alt="item.product.name" class="h-16 w-16 object-cover">
                  </div>
                  <div class="ml-4">
                    <div class="text-sm text-gray-900 font-medium">
                      {{ item.product.name }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Variation details - highlight the bug -->
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">
                  <div v-if="item.selected_size" class="mb-1">
                    Size: <span class="font-medium">{{ item.selected_size }}</span>
                  </div>
                  <div v-else class="text-red-500 mb-1">
                    Size: <span class="font-medium">Not specified!</span>
                  </div>

                  <div v-if="item.selected_color" class="mb-1">
                    Color: <span class="font-medium">{{ item.selected_color }}</span>
                  </div>
                  <div v-else class="text-red-500 mb-1">
                    Color: <span class="font-medium">Not specified!</span>
                  </div>
                </div>
              </td>

              <!-- Unit price -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  ${{ item.price_at_add.toFixed(2) }}
                </div>
              </td>

              <!-- Quantity -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ item.quantity }}
                </div>
              </td>

              <!-- Total for this item -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  ${{ (item.price_at_add * item.quantity).toFixed(2) }}
                </div>
              </td>

              <!-- Added date -->
              <td class="text-sm text-gray-500 px-6 py-4 whitespace-nowrap">
                {{ formatDate(item.added_at) }}
              </td>

              <!-- Remove button -->
              <td class="text-sm font-medium px-6 py-4 text-right whitespace-nowrap">
                <button
                  class="text-red-600 hover:text-red-900"
                  @click="removeFromCart(item.id)"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
