import Link from 'next/link'

// หน้าแรก ใช้ทดสอบว่า deploy สำเร็จ
export default function Home() {
  const linkStyle = {
    display: 'block',
    padding: '16px',
    margin: '12px 0',
    background: '#b03a2e',
    color: '#fff',
    borderRadius: '10px',
    textAlign: 'center',
    textDecoration: 'none',
    fontSize: '18px',
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 24 }}>
      <h1 style={{ textAlign: 'center', fontSize: 36 }}>ซำซำติ่ม</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>
        ระบบสั่งอาหารบุฟเฟต์ติ่มซำ
      </p>
      <Link href="/generate-qr" style={linkStyle}>สร้าง QR เปิดโต๊ะ</Link>
      <Link href="/kitchen" style={linkStyle}>จอครัว</Link>
    </main>
  )
}
