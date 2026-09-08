'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type Product, normalizeWhatsAppPhone, validateCashChange } from '@center-gas/contracts';
import { AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    if (!selectedProduct) return;

    const normalizedPhone = normalizeWhatsAppPhone(phone);
    if (!normalizedPhone) {
      setError('Por favor, informe um telefone válido com DDD.');
      return;
    }

    if (paymentMethod === 'cash' && cashChange !== '') {
      const val = validateCashChange(totalAmount, Number(cashChange));
      if (!val.isValid) {
        setError(val.error || 'O valor de troco informado é inválido.');
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Upsert Customer by Phone
      let customerId;
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', normalizedPhone).single();
      
      if (existing) {
        customerId = existing.id;
        await supabase.from('customers').update({ name: customerName, address_line: address }).eq('id', customerId);
      } else {
        const { data: newCust, error: errCust } = await supabase.from('customers').insert({
          phone: normalizedPhone,
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

      onConfirm();
    } catch (err: unknown) {
      console.error('Error creating order:', err);
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar o pedido.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-orange-600 border-b border-orange-700 p-5">
          <h2 className="text-xl font-black text-white tracking-tight">Lançamento de Pedido Manual</h2>
          <p className="text-orange-100 text-xs mt-0.5">Atendimento telefônico ou pedido via WhatsApp</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-sm font-bold ml-2 cursor-pointer">✕</button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Nome do Cliente</label>
              <input required type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" placeholder="Ex.: Maria Silva" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Telefone com DDD</label>
              <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" placeholder="4199999999" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Endereço Completo de Entrega</label>
            <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" placeholder="Rua 123, 45 - Pinheirinho" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Produto</label>
              <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 bg-white">
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Qtd</label>
                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 bg-white">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="w-2/3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Pagamento</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'pix' | 'cash')} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 bg-white">
                  <option value="pix">PIX</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">Precisa de troco para quanto?</label>
              <div className="flex items-center gap-2">
                <span className="text-amber-800 font-bold text-sm">R$</span>
                <input 
                  type="number" 
                  value={cashChange} 
                  onChange={e => setCashChange(Number(e.target.value))} 
                  className="w-full border border-amber-300 rounded-xl p-2 text-sm text-slate-900 outline-none focus:border-amber-600 bg-white" 
                  placeholder="100.00" 
                />
              </div>
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase text-xs">Total Calculado</span>
            <span className="text-2xl font-black text-slate-900">R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
          </div>

          <div className="bg-slate-50 p-4 flex gap-3 border-t border-slate-100 -mx-6 -mb-6 mt-6">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 hover:bg-orange-700 active:bg-orange-800 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              {loading ? 'Salvando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
