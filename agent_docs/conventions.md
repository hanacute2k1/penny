# Quy ước code

## Định dạng

Prettier (`.prettierrc`): nháy đơn, có dấu chấm phẩy, `printWidth` 100, dấu phẩy cuối. Chạy `npm run format` trước khi commit.

## Component

```
src/components/
└── TenTinhNang/
    ├── index.tsx        # Màn hình chính của tính năng
    └── PhanCon.tsx      # Phần con (khi index.tsx quá dài hoặc phần đó dùng lại)
```

- Props khai báo ngay trong file component (`type Props = {…}`).
- File dùng state, effect, handler hay API trình duyệt thì có `'use client'` ở dòng đầu. File con chỉ được import từ component client thì không cần.
- Trang trong `src/app/` chỉ bọc `Suspense` và render component của tính năng; không đặt logic ở đó.
- Không tạo file riêng cho component vài dòng chỉ dùng một chỗ; để nó trong file đang dùng.

## Popup (sheet)

```tsx
export function ThingSheet({ open, ...props }: Props) {
  // Mount mới mỗi lần mở → form khởi tạo từ `initial`, không cần effect.
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({ onClose, initial }: Omit<Props, 'open'>) {
  return (
    <Sheet title="…" onClose={onClose}>
      …
    </Sheet>
  );
}
```

Hộp xác nhận (`ConfirmDialog`) hay sheet lồng nhau đặt **ngoài** `<Sheet>` (bọc bằng `<>…</>`), vì phần tử `fixed` bên trong khung đang có animation sẽ bị lệch vị trí.

## Dữ liệu

- Đọc/ghi qua `useStore()`. Không gọi `fetch` trong component.
- Thêm một thao tác dữ liệu:
  1. Viết hàm thuần trong `src/lib/store/actions.ts`: `(state, ...args) => AppState`. Trả về đúng `state` cũ nếu không có gì đổi.
  2. Cần id mới thì viết thêm hàm `newXxx(input)` và gọi nó **ngoài** `setState`.
  3. Khai báo kiểu trong `StoreActions` và nối vào `dataActions` của `StoreContext` (thường chỉ là `run(actions.xxx)`).
  4. Viết test trong `src/lib/store/__tests__/actions.test.ts`.
- Thêm một bảng: `supabase/schema.sql` → `COLLECTIONS` trong `src/lib/api/collections.ts` → `AppState`/`EMPTY_STATE` trong `src/lib/store/state.ts` → kiểu trong `src/lib/type/index.ts`.

## Lint mà dự án đang tuân theo

- Không `setState` trong effect để "đồng bộ" giá trị; tính trực tiếp khi render hoặc dùng hàm khởi tạo của `useState`.
- Giá trị lưu ngoài React (localStorage, thuộc tính trên `<html>`) đọc bằng `useSyncExternalStore`.

## Chữ và màu

- Mọi chữ trên giao diện lấy từ `useI18n()` (`t.…`, `tx(template, vars)`); thêm key vào cả `en.ts`, `vi.ts`, `ko.ts`.
- Tiền: `formatVnd(amount, { compact: true, locale })`.
- Màu: dùng class token (`text-ink`, `bg-paper`, `text-coral`, `text-income`…) hoặc biến CSS. Màu danh mục: `categoryTint` / `categoryTone`.

## Hằng số

Storage key, id danh mục có sẵn (`c-other`, `c-other-in`, `c-transport`) và thời gian sync nằm trong `src/lib/constants/index.ts`. Đổi một storage key nghĩa là mọi người dùng mất cài đặt đó.

## Test

Vitest, môi trường node. Đặt trong `__tests__/` cạnh mã nguồn, tên `*.test.ts`. Ưu tiên test hàm thuần (`lib/store`, `lib/helper`).
