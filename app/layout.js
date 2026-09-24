export const metadata = {
  title: 'ซำซำติ่ม',
  description: 'ระบบสั่งอาหารบุฟเฟต์ติ่มซำผ่าน QR Code',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, fontFamily: 'sans-serif' }}>{children}</body>
    </html>
  )
}
