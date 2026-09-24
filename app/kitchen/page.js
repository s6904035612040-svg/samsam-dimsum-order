'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function KitchenPage() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    // โหลดออเดอร์ครั้งแรก
    async function loadOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['received', 'cooking'])
        .order('created_at', { ascending: true })
      if (data) setOrders(data)
    }
    loadOrders()

    // Realtime subscribe
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        const o = payload.new
        if (o.status === 'received' || o.status === 'cooking') {
          setOrders(prev => [...prev, o])
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        const o = payload.new
        if (o.status === 'served') {
          setOrders(prev => prev.filter(x => x.id !== o.id))
        } else {
          setOrders(prev => prev.map(x => x.id === o.id ? o : x))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function setStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
    // Realtime จะจัดการ state ให้อัตโนมัติ
  }

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  function minutesAgo(ts) {
    return Math.floor((Date.now() - new Date(ts)) / 60000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', padding: 16, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', margin: 0 }}>
          🍽️ จอครัว — ซำซำติ่ม
        </h1>
        <div style={{ color: '#aaa', fontSize: 16 }}>
          รอทำ {orders.filter(o => o.status === 'received').length} · กำลังทำ {orders.filter(o => o.status === 'cooking').length}
        </div>
      </div>

      {/* ไม่มีออเดอร์ */}
      {orders.length === 0 && (
        <div style={{ textAlign: 'center', color: '#555', fontSize: 22, marginTop: 80 }}>
          ยังไม่มีออเดอร์ใหม่
        </div>
      )}

      {/* Grid การ์ด */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {orders.map(order => {
          const isCooking = order.status === 'cooking'
          const mins = minutesAgo(order.created_at)
          return (
            <div key={order.id} style={{
              background: isCooking ? '#3d2e00' : '#2a2a2a',
              border: `3px solid ${isCooking ? '#f39c12' : '#444'}`,
              borderRadius: 14,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {/* โต๊ะ + เวลา */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 40, fontWeight: 'bold', color: isCooking ? '#f39c12' : '#fff', lineHeight: 1 }}>
                  โต๊ะ {order.table_number}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#aaa', fontSize: 15 }}>{formatTime(order.created_at)}</div>
                  <div style={{ color: mins >= 10 ? '#e74c3c' : '#888', fontSize: 13, fontWeight: mins >= 10 ? 'bold' : 'normal' }}>
                    {mins} นาทีที่แล้ว
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div style={{
                display: 'inline-block', alignSelf: 'flex-start',
                background: isCooking ? '#f39c12' : '#444',
                color: isCooking ? '#000' : '#ccc',
                fontSize: 13, fontWeight: 'bold',
                padding: '3px 10px', borderRadius: 20,
              }}>
                {isCooking ? '🔥 กำลังทำ' : '🕐 รอทำ'}
              </div>

              {/* รายการอาหาร */}
              <div style={{ borderTop: '1px solid #444', paddingTop: 10 }}>
                {(order.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#eee', fontSize: 18 }}>{item.name}</span>
                    <span style={{ color: '#f39c12', fontSize: 18, fontWeight: 'bold' }}>×{item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* ปุ่ม */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {!isCooking && (
                  <button
                    onClick={() => setStatus(order.id, 'cooking')}
                    style={{ flex: 1, fontSize: 16, fontWeight: 'bold', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#f39c12', color: '#000' }}
                  >
                    🔥 เริ่มทำ
                  </button>
                )}
                <button
                  onClick={() => setStatus(order.id, 'served')}
                  style={{ flex: 1, fontSize: 16, fontWeight: 'bold', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#27ae60', color: '#fff' }}
                >
                  ✅ จัดเสิร์ฟแล้ว
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
