-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  available_sizes TEXT[],
  available_colors TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for products
CREATE INDEX idx_products_name ON products(name);

-- Create user_cart_items table
CREATE TABLE user_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_size TEXT,
  selected_color TEXT,
  price_at_add DECIMAL(10, 2) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for user_cart_items
CREATE INDEX idx_user_cart_items_user_id ON user_cart_items(user_id);
CREATE INDEX idx_user_cart_items_product_id ON user_cart_items(product_id);

-- Enable RLS on the tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Allow public read access to products"
ON products
FOR SELECT
USING (true);

-- Create policies for user_cart_items
CREATE POLICY "Allow user to select their own cart items"
ON user_cart_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow user to insert into their own cart"
ON user_cart_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to update their own cart items"
ON user_cart_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own cart items"
ON user_cart_items
FOR DELETE
USING (auth.uid() = user_id);

-- Insert demo products
INSERT INTO products (name, description, base_price, image_url, available_sizes, available_colors)
VALUES
  ('Classic T-Shirt', 'Premium cotton t-shirt for everyday wear', 29.99, 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'White', 'Navy', 'Red']),
  
  ('Slim Fit Jeans', 'Modern slim fit jeans with stretch comfort', 59.99, 'https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_.jpg', ARRAY['28', '30', '32', '34', '36'], ARRAY['Blue', 'Black', 'Gray']),
  
  ('Leather Jacket', 'Classic leather jacket with premium finish', 199.99, 'https://fakestoreapi.com/img/71HblAHs5xL._AC_UY879_-2.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'Brown']),
  
  ('Running Shoes', 'Lightweight performance running shoes', 89.99, 'https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg', ARRAY['7', '8', '9', '10', '11', '12'], ARRAY['Black/White', 'Blue/Orange', 'Green/Yellow']),
  
  ('Backpack', 'Water-resistant backpack for daily use or travel', 49.99, 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg', ARRAY['One Size'], ARRAY['Black', 'Gray', 'Blue']),
  
  ('Wireless Headphones', 'Noise-cancelling wireless headphones', 129.99, 'https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg', ARRAY['One Size'], ARRAY['Black', 'White', 'Silver']),
  
  ('Smart Watch', 'Fitness and health tracking smartwatch', 199.99, 'https://fakestoreapi.com/img/71Yij%2BACS-L._AC_UL640_QL65_ML3_.jpg', ARRAY['One Size'], ARRAY['Black', 'Silver', 'Gold']),
  
  ('Winter Coat', 'Warm insulated winter coat with water-resistant outer shell', 149.99, 'https://fakestoreapi.com/img/51Y5NI-I%2BIL._AC_UL640_QL65_ML3_.jpg', ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['Black', 'Navy', 'Green']);