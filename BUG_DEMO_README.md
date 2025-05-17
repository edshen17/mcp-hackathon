# Product Variation Bug Demo

This demo showcases a common e-commerce bug where product variations (size and color) are not correctly saved to the cart, even though the user selects them on the product page.

## Bug Description

**Bug**: When a user selects product variations (size and color) and adds a product to their cart, these selected variations are not saved to the database.

**Expected behavior**: When a user selects a size (e.g., "L") and a color (e.g., "Blue") and adds the product to their cart, this information should be stored in the database and displayed in their cart.

**Actual behavior**: The product is added to the cart, but the size and color information is lost. The cart shows "Not specified!" for both fields.

## Technical Details

The bug is in the `addToCart` function in `/app/pages/products.vue`, where the selected variations are retrieved from user input but not passed to the cart item object correctly:

```javascript
// Bug: We're getting the selected size and color but NOT passing them to the cart item
const selectedSize = selectedSizes.value[product.id]
const selectedColor = selectedColors.value[product.id]
const quantity = quantities.value[product.id] || 1

// Create the cart item with the bug - NOT including the selected size and color
const cartItem: CartItem = {
  product_id: product.id,
  quantity: quantity,
  // BUG: These are purposely set to null instead of using the selected values
  selected_size: null, // Should be selectedSize
  selected_color: null, // Should be selectedColor
  price_at_add: product.base_price
}
```

## How to Demo the Bug

1. Log in to the application
2. Navigate to the Products page
3. Select a product, choose a size and color from the dropdown menus
4. Click "Add to Cart"
5. Go to the Cart page (via the cart icon in the header or user menu)
6. Observe that the size and color show "Not specified!" in red, indicating the information was lost

## How to Fix the Bug

To fix the bug, update the `addToCart` function in `app/pages/products.vue` by replacing:

```javascript
selected_size: null, // Should be selectedSize
selected_color: null, // Should be selectedColor
```

With:

```javascript
selected_size: selectedSize,
selected_color: selectedColor,
```

## Database Structure

The bug involves two main tables:

1. `products` - Stores product information including available sizes and colors
2. `user_cart_items` - Stores cart items with references to products and should include the selected variation details

## Demo Data

The application is pre-loaded with demo products including clothing, shoes, and accessories, each with appropriate size and color options.