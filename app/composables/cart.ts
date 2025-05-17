import { useSupabaseClient, useSupabaseUser } from '#imports'

// Use a type instead of interface so it can be both exported and imported
export interface CartItem {
  id: string
  product_id: string
  quantity: number
  selected_size: string | null
  selected_color: string | null
  price_at_add: number
  added_at: string
  product?: {
    name: string
    image_url: string
    available_sizes: string[]
    available_colors: string[]
  }
}

export function useCartStore() {
  const cartItems = ref<CartItem[]>([])
  const loading = ref(false)
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Fetch cart items
  async function fetchCart() {
    if (!user.value)
      return

    try {
      loading.value = true

      const { data, error } = await supabase
        .from('user_cart_items')
        .select(`
          *,
          product:products(name, image_url, available_sizes, available_colors)
        `)
        .eq('user_id', user.value.id)

      if (error)
        throw error

      cartItems.value = data || []
    }
    catch (err: any) {
      console.error('Error fetching cart:', err)
    }
    finally {
      loading.value = false
    }
  }

  // Initialize cart when user changes
  watch(user, () => {
    if (user.value) {
      fetchCart()
    }
    else {
      cartItems.value = []
    }
  }, { immediate: true })

  // Set up realtime subscription to cart changes
  onMounted(() => {
    if (import.meta.client) {
      const channel = supabase
        .channel('cart-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_cart_items',
          filter: user.value ? `user_id=eq.${user.value.id}` : undefined,
        }, () => {
          // Refresh cart when any changes happen
          fetchCart()
        })
        .subscribe()

      // Clean up subscription on unmount
      onUnmounted(() => {
        supabase.removeChannel(channel)
      })
    }
  })

  return {
    cartItems,
    loading,
    fetchCart,
  }
}
