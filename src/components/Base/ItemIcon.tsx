import {
  Baby,
  Banknote,
  Beer,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Cake,
  Camera,
  Car,
  CarTaxiFront,
  Cat,
  Coffee,
  Coins,
  CreditCard,
  Droplets,
  Dumbbell,
  FerrisWheel,
  Film,
  Flower2,
  Fuel,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  HandCoins,
  Hammer,
  Heart,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Lightbulb,
  Luggage,
  Motorbike,
  Mountain,
  Music,
  NotebookPen,
  Package,
  Palette,
  PartyPopper,
  PawPrint,
  Percent,
  PiggyBank,
  Pill,
  Pin,
  Pizza,
  Plane,
  Receipt,
  Sailboat,
  Ship,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sofa,
  Sparkles,
  Star,
  Store,
  Tent,
  Ticket,
  TrainFront,
  TreePalm,
  TrendingUp,
  Trophy,
  Utensils,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Wine,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { glyphFor, type GlyphId } from '@/lib/helper/icons';

export const GLYPHS: Record<GlyphId, LucideIcon> = {
  food: Utensils,
  coffee: Coffee,
  groceries: ShoppingCart,
  home: House,
  car: Car,
  fuel: Fuel,
  health: HeartPulse,
  pill: Pill,
  game: Gamepad2,
  book: BookOpen,
  school: GraduationCap,
  shirt: Shirt,
  gift: Gift,
  plane: Plane,
  pet: PawPrint,
  cat: Cat,
  baby: Baby,
  bulb: Lightbulb,
  power: Zap,
  water: Droplets,
  wifi: Wifi,
  phone: Smartphone,
  laptop: Laptop,
  beauty: Sparkles,
  gym: Dumbbell,
  beer: Beer,
  wine: Wine,
  pizza: Pizza,
  cake: Cake,
  movie: Film,
  music: Music,
  ticket: Ticket,
  camera: Camera,
  sofa: Sofa,
  tools: Hammer,
  bill: Receipt,
  card: CreditCard,
  box: Package,
  flower: Flower2,
  heart: Heart,
  wallet: Wallet,
  work: Briefcase,
  growth: TrendingUp,
  bank: Landmark,
  savings: PiggyBank,
  cash: Banknote,
  coins: Coins,
  bonus: HandCoins,
  store: Store,
  star: Star,
  trophy: Trophy,
  gem: Gem,
  percent: Percent,
  building: Building2,
  outing: FerrisWheel,
  luggage: Luggage,
  beach: TreePalm,
  mountain: Mountain,
  party: PartyPopper,
  bag: ShoppingBag,
  dining: UtensilsCrossed,
  camp: Tent,
  ship: Ship,
  palette: Palette,
  bus: Bus,
  train: TrainFront,
  bike: Bike,
  motorbike: Motorbike,
  taxi: CarTaxiFront,
  sailboat: Sailboat,
  pin: Pin,
  note: NotebookPen,
};

type Props = {
  /** A glyph id, or an emoji the user typed. */
  value: string | undefined;
  /** Shown when there is no value. */
  fallback?: GlyphId;
  size?: number;
  className?: string;
};

/**
 * Icon of a category, plan or transit type: a Lucide line icon, or the user's own
 * emoji. Emoji are sized to match (`size` px), so both sit the same in any tile.
 */
export function ItemIcon({ value, fallback = 'box', size = 20, className = '' }: Props) {
  const glyph = value ? glyphFor(value) : fallback;
  if (glyph) {
    const Glyph = GLYPHS[glyph];
    return (
      <Glyph
        size={size}
        strokeWidth={1.75}
        aria-hidden="true"
        className={`shrink-0 ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 leading-none ${className}`}
      style={{ fontSize: size * 0.95 }}
    >
      {value}
    </span>
  );
}
