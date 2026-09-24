'use client'
 
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
 
export default function GenerateQRPage() {
  const [tableNumber, setTableNumber] = useState('')
  const [adultCount, setAdultCount] = useState(1)
  const [childCount, setChildCount] = useState(0)
  const [loading, setLoading] = useState(false)
 
  // สถานะหน้าจอ: 'form' | 'warning' | 'confirm' | 'qr'
  const [view, setView] = useState('form')
  const [existingSession, setExistingSession] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [closeLoading, setCloseLoading] = useState(false)
 
  // --- เปิดโต๊ะ ---
  async function handleOpen() {
    if (!tableNumber) return alert('กรุณากรอกเลขโต๊ะ')
    setLoading(true)
    const { data: existing } = await supabase
      .from('sessions')
      .select('id, adult_count, child_count, created_at')
      .eq('table_number', tableNumber)
      .eq('status', 'open')
      .maybeSingle()
    setLoading(false)
 
    if (existing) {
      setExistingSession(existing)
      setView('warning')
    } else {
      await openNewSession()
    }
  }
 
  async function openNewSession() {
    setLoading(true)
    const { error } = await supabase.from('sessions').insert({
      table_number: tableNumber,
      adult_count: adultCount,
      child_count: childCount,
      status: 'open',
    })
    setLoading(false)
    if (error) return alert('เกิดข้อผิดพลาด: ' + error.message)
    const url = `${window.location.origin}/order/${tableNumber}`
    setQrData({ url, tableNumber, adultCount, childCount })
    setView('qr')
  }
 
  // --- ปิดโต๊ะเดิม ---
  async function handleConfirmClose() {
    setCloseLoading(true)
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'closed' })
      .eq('id', existingSession.id)
      .eq('status', 'open')
    setCloseLoading(false)
    if (error) return alert('เกิดข้อผิดพลาด: ' + error.message)
    setExistingSession(null)
    setView('form')
  }
 
  function minutesAgo(createdAt) {
    return Math.floor((Date.now() - new Date(createdAt)) / 60000)
  }
 
  function resetForm() {
    setTableNumber('')
    setAdultCount(1)
    setChildCount(0)
    setQrData(null)
    setView('form')
  }
 
  // ---- Styles ----
  const s = {
    page: { maxWidth: 460, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#1a1a1a' },
    label: { display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#333' },
    input: { width: '100%', fontSize: 22, padding: '12px 14px', borderRadius: 10, border: '2px solid #ccc', boxSizing: 'border-box', marginBottom: 16 },
    btn: { width: '100%', fontSize: 20, fontWeight: 'bold', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 4 },
    btnPrimary: { background: '#b03a2e', color: '#fff' },
    btnGray: { background: '#888', color: '#fff', marginTop: 10 },
    btnSmall: { fontSize: 14, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#444', color: '#fff' },
    // warning box
    warnBox: { background: '#fff3cd', border: '2px solid #e67e22', borderRadius: 12, padding: 20, marginBottom: 16 },
    warnTitle: { fontSize: 18, fontWeight: 'bold', color: '#a04000', marginBottom: 12 },
    btnWarn: { width: '100%', fontSize: 18, fontWeight: 'bold', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#e74c3c', color: '#fff', marginTop: 8 },
    // confirm overlay
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
    confirmBox: { background: '#fff', borderRadius: 14, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' },
    confirmTitle: { fontSize: 20, fontWeight: 'bold', color: '#c0392b', marginBottom: 14 },
    confirmRow: { fontSize: 17, marginBottom: 6, color: '#333' },
    // qr
    qrBox: { textAlign: 'center' },
    qrImg: { borderRadius: 12, border: '3px solid #eee', marginBottom: 12 },
    qrSummary: { fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#222' },
    qrUrl: { fontSize: 13, color: '#555', wordBreak: 'break-all', marginBottom: 12 },
  }
 
  return (
    <div style={s.page}>
      <h1 style={s.title}>🥢 ซำซำติ่ม — เปิดโต๊ะ</h1>
 
      {/* ===== FORM ===== */}
      {(view === 'form' || view === 'warning') && (
        <div>
          <label style={s.label}>เลขโต๊ะ</label>
          <input style={s.input} type="number" min="1" value={tableNumber}
            onChange={e => setTableNumber(e.target.value)} placeholder="เช่น 7" />
 
          <label style={s.label}>จำนวนผู้ใหญ่</label>
          <input style={s.input} type="number" min="1" value={adultCount}
            onChange={e => setAdultCount(Number(e.target.value))} />
 
          <label style={s.label}>จำนวนเด็ก</label>
          <input style={s.input} type="number" min="0" value={childCount}
            onChange={e => setChildCount(Number(e.target.value))} />
 
          {/* กล่องเตือนโต๊ะค้าง */}
          {view === 'warning' && existingSession && (
            <div style={s.warnBox}>
              <div style={s.warnTitle}>⚠️ โต๊ะนี้มีลูกค้าอยู่ระหว่างทานอาหาร</div>
              <div style={{ fontSize: 15, color: '#7d4e00', marginBottom: 10 }}>
                กรุณาปิดออเดอร์เดิมก่อน แล้วกด "เปิดโต๊ะ" อีกครั้ง
              </div>
              <button style={s.btnWarn} onClick={() => setView('confirm')}>
                ปิดออเดอร์เดิม
              </button>
            </div>
          )}
 
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={handleOpen} disabled={loading}>
            {loading ? 'กำลังตรวจสอบ...' : 'เปิดโต๊ะ'}
          </button>
        </div>
      )}
 
      {/* ===== CONFIRM DIALOG (overlay) ===== */}
      {view === 'confirm' && existingSession && (
        <div style={s.overlay}>
          <div style={s.confirmBox}>
            <div style={s.confirmTitle}>🔴 ยืนยันปิดโต๊ะเดิม?</div>
            <div style={s.confirmRow}>โต๊ะ <b>{tableNumber}</b></div>
            <div style={s.confirmRow}>ผู้ใหญ่ {existingSession.adult_count} · เด็ก {existingSession.child_count}</div>
            <div style={{ ...s.confirmRow, color: '#c0392b', fontWeight: 600, marginBottom: 20 }}>
              เปิดมาแล้ว {minutesAgo(existingSession.created_at)} นาที
            </div>
            <button
              style={{ ...s.btn, ...s.btnPrimary, marginBottom: 10 }}
              onClick={handleConfirmClose}
              disabled={closeLoading}
            >
              {closeLoading ? 'กำลังปิด...' : 'ยืนยันปิดโต๊ะเดิม'}
            </button>
            <button style={{ ...s.btn, ...s.btnGray }} onClick={() => setView('warning')}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}
 
      {/* ===== QR RESULT ===== */}
      {view === 'qr' && qrData && (
        <div style={s.qrBox}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.url)}`}
            alt="QR Code"
            width={300}
            height={300}
            style={s.qrImg}
          />
          <div style={s.qrSummary}>
            โต๊ะ {qrData.tableNumber} · ผู้ใหญ่ {qrData.adultCount} · เด็ก {qrData.childCount}
          </div>
          <div style={s.qrUrl}>{qrData.url}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            <button style={s.btnSmall} onClick={() => navigator.clipboard.writeText(qrData.url)}>
              คัดลอกลิงก์
            </button>
          </div>
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={resetForm}>
            เปิดโต๊ะใหม่
          </button>
        </div>
      )}
    </div>
  )
}
