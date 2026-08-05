const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_ANON_KEY);

async function testRpc() {
  // Get active products
  const { data: products } = await supabase.from('products').select('*').eq('is_active', true);
  if (!products || products.length === 0) {
    console.log('No active products found.');
    return;
  }
  
  const product = products[0];
  console.log('Found product:', product.name, product.id);

  const payload = {
    p_phone: '41999999999',
    p_address_line: 'Rua Test 123',
    p_items: [{ product_id: product.id, quantity: 1 }],
    p_payment_method: 'cash',
    p_cash_change_for: 200
  };

  console.log('Calling RPC with payload:', payload);

  const { data, error } = await supabase.rpc('create_b2c_order', payload);
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success:', data);
  }
}

testRpc();
