# Kiến trúc

## Thư mục

```
src/
├── app/                      # Route (App Router)
│   ├── layout.tsx            # Boot script (theme, cỡ chữ, glass, mục ẩn) + providers
│   ├── (main)/               # Tổng quan, Giao dịch, Ngân sách, Kế hoạch, Đi lại, Báo cáo
│   ├── settings/             # Cài đặt, Danh mục, Chi cố định, Khoản dự kiến
│   ├── login/, auth/callback # Đăng nhập magic link
│   └── api/v1/               # REST API (Route Handler)
├── apis/data.ts              # Client gọi API: fetchRemoteState, pushChanges
├── components/
│   ├── Base/                 # Dùng chung: Sheet, ConfirmDialog, Icon, Amount, Segmented…
│   ├── Layout/               # Khung app: thanh bên, thanh dưới, chọn tháng, báo lỗi sync
│   └── [Feature]/            # index.tsx = màn hình chính, các file khác = phần con
├── contexts/                 # StoreContext, ThemeContext, I18nContext
├── hooks/                    # useMonth (?month=YYYY-MM), useHiddenModules
├── lib/
│   ├── store/                # state.ts (AppState, reset, diff), actions.ts, seed.ts
│   ├── helper/               # Hàm thuần: format, date, recurring, monthPlans, spendPlans…
│   ├── api/                  # Phía server: collections.ts (zod), server.ts (Supabase)
│   ├── i18n/                 # Từ điển vi/en/ko + chọn ngôn ngữ
│   ├── theme/                # Token màu, áp theme lên <html>
│   ├── supabase/             # Client trình duyệt / server
│   ├── constants/            # Storage key, id danh mục có sẵn, thời gian sync
│   └── type/                 # Kiểu dữ liệu chung
└── proxy.ts                  # Làm mới phiên + chặn trang khi chưa đăng nhập
```

## Luồng dữ liệu

1. Vào app, `StoreProvider` gọi `fetchRemoteState()` (`GET /api/v1/data`).
   - Tài khoản trống → `createStarterState()` (danh mục + loại phương tiện mặc định). Nếu máy còn dữ liệu bản cũ trong localStorage thì hiện lời mời nhập (`importOffer`).
   - Sau đó `withAutoPosts` ghi các khoản chi cố định và khoản dự kiến đã tới hạn của tháng này.
2. Component gọi action, ví dụ `addTransaction(input)`. Action chạy hàm thuần trong `lib/store/actions.ts` bên trong `setState`, giao diện cập nhật ngay.
3. 400ms sau lần sửa cuối, `flush()` lấy `diffState(confirmed, latest)` và gửi `POST /api/v1/sync` (upserts + deletes). Mỗi lúc chỉ một request; lỗi thì thử lại với thời gian chờ tăng dần (2s → tối đa 30s). Khi ẩn tab thì gửi luôn với `keepalive`.
4. Server (`lib/api/server.ts`) kiểm tra phiên, validate bằng zod, ghi vào bảng với `user_id`. RLS của Postgres bảo đảm mỗi người chỉ thấy dòng của mình.
5. Gặp 401 ở bất kỳ đâu → tải lại trang `/login?next=…` (xoá sạch dữ liệu trong bộ nhớ).

## Dữ liệu (`AppState`)

8 mảng, mỗi mảng là một bảng: `categories`, `transactions`, `budgets` (khoá `yearMonth`), `recurringRules`, `monthPlans`, `transportMeters`, `transportEntries`, `spendPlans`. Số tiền là số nguyên VND. Dữ liệu lồng (hạn mức theo danh mục, chặng đi, mục kế hoạch) lưu dạng jsonb.

Danh mục có sẵn chỉ được dịch khi tên còn nguyên như mặc định; người dùng đổi tên thì giữ tên của họ.

## Đăng nhập

Magic link qua email của Supabase. `/auth/callback` đổi mã lấy phiên; `proxy.ts` làm mới cookie phiên và chuyển người chưa đăng nhập về `/login`.

## Giao diện, ngôn ngữ

- Theme, cỡ chữ, Liquid Glass và các mục bị ẩn được áp lên `<html>` bởi boot script trong `app/layout.tsx` **trước khi vẽ**, nên tải lại trang không bị nháy. React đọc lại chúng qua `useSyncExternalStore` (`ThemeContext`, `useHiddenModules`).
- Ngôn ngữ lưu trong cookie `valoir-locale`; server đọc cookie (hoặc `Accept-Language`) để render đúng ngôn ngữ ngay lần đầu.
