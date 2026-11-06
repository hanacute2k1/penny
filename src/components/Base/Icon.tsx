import {
  CalendarDays,
  Car,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  ClipboardCheck,
  Coins,
  Droplet,
  Eye,
  Globe,
  House,
  Minus,
  Moon,
  Pencil,
  Plus,
  ReceiptText,
  Repeat,
  Search,
  SlidersHorizontal,
  Sun,
  Tag,
  Trash2,
  Type,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';

/** App interface icons (Lucide), by the names the screens use. */
const icons = {
  home: House,
  transport: Car,
  list: ReceiptText,
  plan: ClipboardCheck,
  wallet: Wallet,
  chart: ChartColumn,
  settings: SlidersHorizontal,
  sun: Sun,
  moon: Moon,
  glass: Droplet,
  tag: Tag,
  repeat: Repeat,
  calendar: CalendarDays,
  eye: Eye,
  text: Type,
  globe: Globe,
  coin: Coins,
  user: CircleUser,
  plus: Plus,
  minus: Minus,
  trash: Trash2,
  edit: Pencil,
  close: X,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  search: Search,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

type Props = {
  name: IconName;
  size?: number;
  className?: string;
};

export function Icon({ name, size = 22, className }: Props) {
  const Glyph = icons[name];
  return (
    <Glyph
      size={size}
      strokeWidth={1.8}
      aria-hidden="true"
      className={`shrink-0 ${className ?? ''}`}
    />
  );
}
