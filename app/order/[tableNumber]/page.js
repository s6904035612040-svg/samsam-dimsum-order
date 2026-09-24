'use client'

import { use, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function OrderPage({ params }) {
  const { tableNumber } = use(params)

  const [session, setSession] = useState(null)
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState(null)
  const [cart, setCart] = useState({}) // { itemId: { name, quantity } }
  const [pageState, setPageState] = useState('loading') // loading | no-session | order | confirm | done
  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState(false)

  // โหลด session + เมนู
  useEffect(() => {
    async function init() {
      const { data: sess } = await supabase
        .from('sessions')
        .select('id, adult_count, child_count')
        .eq('table_number', tableNumber)
        .eq('status', 'open')
        .maybeSingle()

      if (!sess) { setPageState('no-session'); return }
      setSession(sess)

      const { data: cats } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order')

      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')

      setCategories(cats || [])
      setItems(menuItems || [])
      if (cats && cats.length > 0) setActiveTab(cats[0].id)
      setPageState('order')
    }
    init()
  }, [tableNumber])

  // ---- Cart helpers ----
  const cartList = Object.values(cart)
  const cartCount = cartList.reduce((s, i) => s + i.quantity, 0)
  const cartItemCount = cartList.length

  function addToCart(item) {
    if (cartItemCount >= 10 && !cart[item.id]) return
    setCart(prev => {
      const cur = prev[item.id]
      if (cur && cur.quantity >= 5) return prev
      return { ...prev, [item.id]: { name: item.name, quantity: (cur?.quantity || 0) + 1 } }
    })
  }

  function removeFromCart(itemId) {
    setCart(prev => {
      const cur = prev[itemId]
      if (!cur) return prev
      if (cur.quantity <= 1) {
        const next = { ...prev }; delete next[itemId]; return next
      }
      return { ...prev, [itemId]: { ...cur, quantity: cur.quantity - 1 } }
    })
  }

  // ---- ส่งออเดอร์ ----
  async function handleSend() {
    if (cartList.length === 0) return
    setSending(true)
    const { error } = await supabase.from('orders').insert({
      session_id: session.id,
      table_number: tableNumber,
      items: cartList.map(i => ({ name: i.name, quantity: i.quantity })),
      status: 'received',
    })
    setSending(false)
    if (error) return alert('เกิดข้อผิดพลาด: ' + error.message)
    setCart({})
    setSentMsg(true)
    setTimeout(() => setSentMsg(false), 2500)
  }

  // ---- เรียกเก็บเงิน ----
  async function handleCheckout() {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'closed' })
      .eq('id', session.id)
    if (error) return alert('เกิดข้อผิดพลาด: ' + error.message)
    setPageState('done')
  }

  const total = session
    ? session.adult_count * 259 + session.child_count * 129
    : 0

  // ---- Styles ----
  const s = {
    page: { maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: 120 },
    header: { background: '#b03a2e', color: '#fff', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', margin: 0 },
    btnCheckout: { fontSize: 13, fontWeight: 'bold', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fff', color: '#b03a2e' },
    tabs: { display: 'flex', overflowX: 'auto', background: '#f5f5f5', borderBottom: '2px solid #ddd' },
    tab: (active) => ({
      flexShrink: 0, padding: '12px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      background: active ? '#fff' : 'transparent',
      color: active ? '#b03a2e' : '#555',
      borderBottom: active ? '2px solid #b03a2e' : '2px solid transparent',
    }),
    menuItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #eee' },
    menuName: { fontSize: 17, color: '#222' },
    qtyRow: { display: 'flex', alignItems: 'center', gap: 8 },
    btnCircle: (color) => ({ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 'bold', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    qtyNum: { fontSize: 18, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
    // floating cart
    cartBar: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#222', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -2px 12px rgba(0,0,0,0.2)' },
    cartInfo: { fontSize: 15 },
    btnSend: { fontSize: 16, fontWeight: 'bold', padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#b03a2e', color: '#fff' },
    // overlay
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 },
    confirmBox: { background: '#fff', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%' },
    confirmTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#1a1a1a' },
    confirmAmount: { fontSize: 36, fontWeight: 'bold', color: '#b03a2e', marginBottom: 20, textAlign: 'center' },
    btnConfirm: { width: '100%', fontSize: 18, fontWeight: 'bold', padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#b03a2e', color: '#fff', marginBottom: 10 },
    btnCancel: { width: '100%', fontSize: 16, padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#eee', color: '#333' },
    // full-page states
    fullPage: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' },
  }

  // ===== STATES =====

  if (pageState === 'loading') return (
    <div style={s.fullPage}><p style={{ fontSize: 18, color: '#888' }}>กำลังโหลด...</p></div>
  )

  if (pageState === 'no-session') return (
    <div style={s.fullPage}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
      <p style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>โต๊ะนี้ยังไม่เปิดใช้งาน</p>
      <p style={{ fontSize: 16, color: '#888', marginTop: 8 }}>กรุณาแจ้งพนักงาน</p>
    </div>
  )

  if (pageState === 'done') return (
    <div style={{ ...s.fullPage, background: '#f0fff4' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🙏</div>
      <p style={{ fontSize: 26, fontWeight: 'bold', color: '#1a7a3c' }}>ขอบคุณที่ใช้บริการ</p>
      <p style={{ fontSize: 16, color: '#555', marginTop: 8 }}>ซำซำติ่ม</p>
    </div>
  )

  const tabItems = items.filter(i => i.category_id === activeTab)

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.headerTitle}>🥢 โต๊ะ {tableNumber}</h1>
        <button style={s.btnCheckout} onClick={() => setPageState('confirm')}>
          💳 เรียกเก็บเงิน
        </button>
      </div>

      {/* แจ้งส่งออเดอร์สำเร็จ */}
      {sentMsg && (
        <div style={{ background: '#d4edda', color: '#155724', textAlign: 'center', padding: '12px', fontSize: 16, fontWeight: 600 }}>
          ✅ ส่งออเดอร์แล้ว!
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        {categories.map(cat => (
          <div key={cat.id} style={s.tab(activeTab === cat.id)} onClick={() => setActiveTab(cat.id)}>
            {cat.name}
          </div>
        ))}
      </div>

      {/* Menu items */}
      <div>
        {tabItems.map(item => {
          const qty = cart[item.id]?.quantity || 0
          return (
            <div key={item.id} style={s.menuItem}>
              <span style={s.menuName}>{item.name}</span>
              <div style={s.qtyRow}>
                {qty > 0 && (
                  <>
                    <button style={s.btnCircle('#888')} onClick={() => removeFromCart(item.id)}>−</button>
                    <span style={s.qtyNum}>{qty}</span>
                  </>
                )}
                <button
                  style={s.btnCircle(qty >= 5 ? '#ccc' : '#b03a2e')}
                  onClick={() => addToCart(item)}
                  disabled={qty >= 5 || (cartItemCount >= 10 && !cart[item.id])}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div style={s.cartBar}>
          <div style={s.cartInfo}>
            <span style={{ fontSize: 13, color: '#aaa' }}>{cartItemCount} รายการ · {cartCount} ชิ้น</span>
          </div>
          <button style={s.btnSend} onClick={handleSend} disabled={sending}>
            {sending ? 'กำลังส่ง...' : '📤 ส่งออเดอร์'}
          </button>
        </div>
      )}

      {/* Confirm checkout overlay */}
      {pageState === 'confirm' && (
        <div style={s.overlay}>
          <div style={s.confirmBox}>
            <div style={s.confirmTitle}>💳 เรียกเก็บเงิน</div>
            <div style={{ fontSize: 15, color: '#555', marginBottom: 8 }}>
              ผู้ใหญ่ {session.adult_count} × 259 + เด็ก {session.child_count} × 129
            </div>
            <div style={s.confirmAmount}>{total.toLocaleString()} บาท</div>
            <button style={s.btnConfirm} onClick={handleCheckout}>ยืนยันชำระเงิน</button>
            <button style={s.btnCancel} onClick={() => setPageState('order')}>ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  )
}
