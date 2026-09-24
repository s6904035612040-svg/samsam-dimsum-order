# ซำซำติ่ม — ระบบสั่งอาหารบุฟเฟต์ติ่มซำ (QR + จอครัว)

Next.js (App Router, JavaScript) + Supabase, deploy บน Vercel

## ข้อควรจำ (สำคัญ)

โปรเจกต์นี้ใช้ Next.js เวอร์ชันใหม่ ซึ่ง `params` ของ Dynamic Route เป็น **Promise**
ต้อง unwrap ด้วย `use()` จาก React เสมอ:

    import { use } from 'react'
    const { tableNumber } = use(params)

ห้ามเขียน `const { tableNumber } = params` ตรงๆ

## Environment Variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## โครงสร้างตาราง (สร้างไว้แล้วใน Supabase)

- sessions (id, table_number, adult_count, child_count, status, created_at)
- menu_categories (id, name, sort_order)
- menu_items (id, category_id, name)
- orders (id, session_id, table_number, items jsonb, status, created_at)

## หน้าที่จะมี

- / หน้าแรก
- /generate-qr สร้าง QR เปิดโต๊ะ
- /order/[tableNumber] หน้าสั่งอาหาร
- /kitchen จอครัว
