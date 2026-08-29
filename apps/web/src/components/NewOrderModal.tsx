'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product } from '@center-gas/contracts';

interface NewOrderModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function NewOrderModal({ onConfirm, onCancel }: NewOrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash'>('pix');
  const [cashChange, setCashChange] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).then(({ data }) => {
      if (data) {
        setProducts(data);
        if (data.length > 0) setProductId(data[0].id);
      }
    });
  }, []);

  const selectedProduct = products.find(p => p.id === productId);
  const totalAmount = selectedProduct ? quantity * selectedProduct.price : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);

    try {
      // 1. Upsert Customer by Phone
      let customerId;
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone).single();
      
      if (existing) {
        customerId = existing.id;
        // Update name/address if empty previously
        await supabase.from('customers').update({ name: customerName, address_line: address }).eq('id', customerId);
      } else {
        const { data: newCust, error: errCust } = await supabase.from('customers').insert({
          phone,
          name: customerName,
          address_line: address
        }).select().single();
        if (errCust) throw errCust;
        customerId = newCust.id;
      }

      // 2. Create Order
      const displayId = Math.floor(1000 + Math.random() * 9000).toString();
      const { data: newOrder, error: errOrder } = await supabase.from('orders').insert({
        display_id: displayId,
        customer_id: customerId,
        status: 'nuevo',
        payment_method: paymentMethod,
        cash_change_for: paymentMethod === 'cash' && cashChange !== '' ? Number(cashChange) : null,
        total_amount: totalAmount,
      }).select().single();
      if (errOrder) throw errOrder;

      // 3. Create Order Item
      await supabase.from('order_items').insert({
        order_id: newOrder.id,
        product_id: selectedProduct.id,
        quantity,
        unit_price: selectedProduct.price
      });

      onConfirm(); // Just close modal, Realtime handles the UI update!
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear el pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-orange-500 border-b border-orange-600 p-5">
          <h2 className="text-xl font-bold text-white">Ingresar Pedido Manual</h2>
          <p className="text-orange-100 text-sm mt-1">Llamada telefónica o audio de WhatsApp</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
              <input required type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-500" placeholder="Ej: Maria Silva" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
              <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-500" placeholder="4199999999" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección Completa</label>
            <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-500" placeholder="Rua 123, Barrio..." />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Producto</label>
              <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-500">
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cant</label>
                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-500">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="w-2/3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pago</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'pix' | 'cash')} className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-500">
                  <option value="pix">PIX</option>
                  <option value="cash">Efectivo</option>
                </select>
              </div>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-2 animate-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-yellow-800 mb-1">¿Precisa Troco para cuánto?</label>
              <div className="flex items-center gap-2">
                <span className="text-yellow-700 font-bold">R$</span>
                <input 
                  type="number" 
                  value={cashChange} 
                  onChange={e => setCashChange(Number(e.target.value))} 
                  className="w-full border-2 border-yellow-300 rounded-xl p-2 outline-none focus:border-yellow-600 bg-white" 
                  placeholder="100.00" 
                />
              </div>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-gray-500 font-semibold uppercase text-sm">Total Calculado</span>
            <span className="text-3xl font-black text-gray-900">R$ {totalAmount.toFixed(2)}</span>
          </div>

          <div className="bg-gray-50 p-4 flex gap-3 border-t border-gray-100 -mx-6 -mb-6 mt-6">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-700 active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Cargar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
