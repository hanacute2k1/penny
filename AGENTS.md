<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Penny

Quy tắc dự án cho Claude Code, Cursor, Codex. File gốc là file này; `CLAUDE.md` chỉ import nó.

## Lệnh

- **Dev**: `npm run dev` (port 3000, Turbopack)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Type check**: `npm run type-check`
- **Test**: `npm test` (vitest)
- **Format**: `npm run format`, chỉ kiểm tra: `npm run format:check`

Sửa code xong thì chạy lint, type-check, test và format:check cho tới khi sạch.

## Kiến trúc

Penny là app quản lý chi tiêu theo tháng: Next.js App Router + React + TypeScript (strict) + Tailwind v4, dữ liệu ở Supabase (Postgres + RLS), đăng nhập bằng tên + mật khẩu (hoặc khách). Giao diện 3 ngôn ngữ: vi, en, ko.

### Quy tắc chính

- **Dữ liệu trên client**: mọi màn hình đọc/ghi qua `useStore()` (`src/contexts/StoreContext.tsx`). Sửa hiện ngay (optimistic) rồi được lưu sau 400ms: store so sánh với trạng thái server đã xác nhận và chỉ gửi các dòng thay đổi.
- **Thay đổi dữ liệu**: viết thành hàm thuần `(state, ...args) => state` trong `src/lib/store/actions.ts`, rồi nối vào `StoreContext`. Không viết logic dữ liệu trong component. Id mới (`crypto.randomUUID()`) tạo ở hàm `new…` bên ngoài `setState`.
- **API**: client gọi qua `src/apis/data.ts`. Server là Route Handler trong `src/app/api/v1/`, dùng `src/lib/api/server.ts` (xác thực, đọc/ghi) và `src/lib/api/collections.ts` (bảng, khoá, zod schema). Thêm bảng mới: sửa `supabase/schema.sql`, `COLLECTIONS`, `AppState`.
- **Component**: `src/components/[Feature]/index.tsx` + component con cùng thư mục. Component dùng chung ở `src/components/Base/`. Props khai báo trong file component. File có state/effect/handler/browser API thì khai báo `'use client'`.
- **Popup dạng sheet**: dùng `Sheet` (`src/components/Base/Sheet.tsx`), chỉ mount khi mở (`open ? <SheetBody /> : null`) để form khởi tạo lại mà không cần effect.
- **Hằng số**: storage key, id danh mục có sẵn, thời gian sync ở `src/lib/constants/index.ts`. **Kiểu dữ liệu chung**: `src/lib/type/index.ts`. **Hàm thuần**: `src/lib/helper/`.
- **Chữ trên giao diện**: không viết cứng. Thêm key vào cả 3 file `src/lib/i18n/dictionaries/{en,vi,ko}.ts` (en là kiểu gốc). Viết tự nhiên theo từng ngôn ngữ, ngắn để không vỡ layout.
- **Giao diện**: màu lấy từ token CSS (`src/app/globals.css`, `src/lib/theme/tokens.ts`), không dùng mã màu cứng. Liquid Glass chỉ áp lên phần nổi (thanh điều hướng, nút, sheet).
- **Test**: đặt trong `__tests__/` cạnh mã nguồn, tên `*.test.ts`.

### Tài liệu chi tiết

Đọc `agent_docs/` khi làm việc lớn:

- `agent_docs/architecture.md` — cấu trúc thư mục, luồng dữ liệu, đăng nhập, theme
- `agent_docs/conventions.md` — quy ước code, cách thêm tính năng
