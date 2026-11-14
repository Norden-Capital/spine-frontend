import type { CSSProperties, ComponentType, ReactNode, SVGProps } from "react";
import {
  Add,
  Airplane,
  Archive,
  ArrowDown2,
  ArrowLeft2,
  ArrowRight2,
  ArrowSwapHorizontal,
  ArrowUp,
  Bag2,
  Bank,
  Box,
  Briefcase,
  Bus,
  Calendar,
  CalendarTick,
  Camera,
  Car,
  Card,
  Category2,
  Clock,
  Chart2,
  CloseCircle,
  CloudCross,
  Coffee,
  ColorSwatch,
  Copy,
  Danger,
  DocumentText,
  Edit2,
  ExportSquare,
  Eye,
  EyeSlash,
  FingerScan,
  Flag,
  Flash,
  GasStation,
  Gift,
  Global,
  HambergerMenu,
  Home,
  InfoCircle,
  Key,
  Location,
  Lock1,
  Login,
  Logout,
  MessageQuestion,
  Minus,
  Mobile,
  Money,
  Monitor,
  More,
  Music,
  Notification,
  Paperclip2,
  Pause,
  Pet,
  Play,
  Printer,
  Profile,
  Profile2User,
  ReceiptText,
  Repeat,
  RotateLeft,
  Scan,
  SearchNormal1,
  SearchZoomOut,
  Setting2,
  Setting4,
  ShieldTick,
  ShoppingBag,
  ShoppingCart,
  Sms,
  Strongbox,
  Tag,
  Teacher,
  Ticket,
  TickCircle,
  Trash,
  Truck,
  UserAdd,
  UserRemove,
  Wallet,
  Warning2,
  Wifi,
  Drop,
  Award,
  Bag,
  Book1,
  Brush2,
  Building4,
  Cake,
  Calculator,
  Chart,
  Cloud,
  CloudConnection,
  Code1,
  Coin1,
  Layer,
  Devices,
  DocumentCode,
  Driver,
  Folder,
  GlobalSearch,
  Graph,
  Headphone,
  Hierarchy,
  Keyboard,
  LampOn,
  Link2,
  Lock,
  Magicpen,
  Map1,
  Messages,
  MoneyAdd,
  MoneyChange,
  MoneyRecive,
  PenTool,
  PercentageSquare,
  Personalcard,
  ReceiptMinus,
  RepeatCircle,
  Routing,
  TrendUp,
  UserTick,
  WalletMoney,
} from "iconsax-react";
import { cn } from "@/lib/utils";

/*
 * Spine icons — one map for the whole app.
 *
 * Style = MasterDB: iconsax "Bulk", two tones of the CURRENT text colour
 * (one part solid, one part 40% opacity). Colours stay Spine's: the icon
 * takes the colour of its parent (black, white, purple…). Active / chosen
 * icons can be tinted with `text-(--sp-card-front)`.
 *
 * Icons iconsax does not have are drawn here in the same two-tone style.
 * Size: CSS (`size-[18px]`, or the parent's `[&_svg]:size-…`); default 24.
 *
 * Three ways in:
 * - by meaning:      <IconHome />, <IconSearch /> …
 * - by Lucide name:  LUCIDE_TO_SP.ArrowLeftRight  (to swap old imports 1:1)
 * - by DB key:       <CategoryIconSp name="shopping-cart" />  (category icons;
 *                    the keys stored in the DB stay the Lucide keys)
 */

export type SpIconProps = {
  className?: string;
  style?: CSSProperties;
  /** Give a label only for icons that stand alone (no text next to them). */
  "aria-label"?: string;
};
export type SpIcon = ComponentType<SpIconProps>;

const SOFT = 0.4;

type IconsaxIcon = ComponentType<
  {
    variant?: "Bulk";
    color?: string;
    size?: number | string;
  } & SVGProps<SVGSVGElement>
>;

function bulk(Icon: IconsaxIcon, name: string): SpIcon {
  // iconsax passes the other props to its <svg>, so the kit's `[&_svg]:size-…` still sizes it.
  function SpBulkIcon({ className, style, "aria-label": label }: SpIconProps) {
    return (
      <Icon
        variant="Bulk"
        color="currentColor"
        size={24}
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn("shrink-0", className)}
        style={style}
        data-sp-icon={name}
      />
    );
  }
  SpBulkIcon.displayName = `Sp${name}`;
  return SpBulkIcon;
}

function drawn(name: string, children: ReactNode): SpIcon {
  function SpDrawnIcon({ className, style, "aria-label": label }: SpIconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn("shrink-0", className)}
        style={{ width: 24, height: 24, ...style }}
        data-sp-icon={name}
      >
        {children}
      </svg>
    );
  }
  SpDrawnIcon.displayName = `Sp${name}`;
  return SpDrawnIcon;
}

/* ---------- drawn in the Bulk style (no iconsax match) ---------- */

export const IconTrain = drawn(
  "Train",
  <>
    <rect opacity={SOFT} x="5" y="2.5" width="14" height="15.5" rx="4.5" />
    <rect x="7.5" y="5.5" width="9" height="5" rx="1.6" />
    <circle cx="9" cy="14.2" r="1.3" />
    <circle cx="15" cy="14.2" r="1.3" />
    <path d="M8.3 18.4h1.9l-1.9 3.1a.85.85 0 0 1-1.45-.88Zm7.4 0h-1.9l1.9 3.1a.85.85 0 0 0 1.45-.88Z" />
  </>
);

export const IconParking = drawn(
  "Parking",
  <>
    <rect opacity={SOFT} x="3" y="3" width="18" height="18" rx="6" />
    <path
      fillRule="evenodd"
      d="M9.4 7.2h3.4a3.45 3.45 0 0 1 0 6.9h-2.6v2.85a.8.8 0 0 1-1.6 0V8a.8.8 0 0 1 .8-.8Zm.8 1.6v3.7h2.6a1.85 1.85 0 0 0 0-3.7Z"
    />
  </>
);

export const IconBed = drawn(
  "Bed",
  <>
    <rect opacity={SOFT} x="2.5" y="10.5" width="19" height="7" rx="2.2" />
    <rect x="4.5" y="6.5" width="6.5" height="4" rx="2" />
    <rect x="3" y="16.5" width="1.8" height="3.5" rx=".9" />
    <rect x="19.2" y="16.5" width="1.8" height="3.5" rx=".9" />
  </>
);

export const IconUtensils = drawn(
  "Utensils",
  <>
    <circle opacity={SOFT} cx="12" cy="12" r="9.75" />
    <rect x="6.9" y="5.5" width="1" height="4.6" rx=".5" />
    <rect x="8.45" y="5.5" width="1" height="4.6" rx=".5" />
    <rect x="10" y="5.5" width="1" height="4.6" rx=".5" />
    <rect x="6.9" y="9.2" width="4.1" height="2.4" rx="1.2" />
    <rect x="8.2" y="10.5" width="1.5" height="8" rx=".75" />
    <path d="M15.3 5.6c1.9.55 2.7 2.65 2.7 5.3v1.9h-1.55v5a.75.75 0 0 1-1.5 0V6.3a.72.72 0 0 1 .35-.7Z" />
  </>
);

export const IconDumbbell = drawn(
  "Dumbbell",
  <>
    <rect opacity={SOFT} x="6" y="10.75" width="12" height="2.5" rx="1.25" />
    <rect x="2.5" y="8.5" width="2.6" height="7" rx="1.3" />
    <rect x="5.1" y="6.5" width="2.8" height="11" rx="1.4" />
    <rect x="16.1" y="6.5" width="2.8" height="11" rx="1.4" />
    <rect x="18.9" y="8.5" width="2.6" height="7" rx="1.3" />
  </>
);

export const IconShirt = drawn(
  "Shirt",
  <>
    <path
      opacity={SOFT}
      d="M8.6 3.5 4.1 5.55a1.1 1.1 0 0 0-.6 1.22l.72 3.28a1.1 1.1 0 0 0 1.3.84L7 10.6v8.9c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-8.9l1.48.3a1.1 1.1 0 0 0 1.3-.85l.72-3.28a1.1 1.1 0 0 0-.6-1.22L15.4 3.5Z"
    />
    <path d="M8.6 3.5h6.8a3.4 3.4 0 0 1-6.8 0Z" />
  </>
);

export const IconBaby = drawn(
  "Baby",
  <>
    <circle opacity={SOFT} cx="12" cy="13" r="8.25" />
    <circle cx="9.2" cy="12.4" r="1.1" />
    <circle cx="14.8" cy="12.4" r="1.1" />
    <path d="M9.55 15.55a.75.75 0 0 1 1.04.21 1.7 1.7 0 0 0 2.82 0 .75.75 0 1 1 1.25.83 3.2 3.2 0 0 1-5.32 0 .75.75 0 0 1 .21-1.04ZM12 2.3a2.6 2.6 0 0 1 2.5 1.9.75.75 0 0 1-1.45.38A1.1 1.1 0 1 0 12 6a.75.75 0 0 1 0 1.5 2.6 2.6 0 0 1 0-5.2Z" />
  </>
);

export const IconWrench = drawn(
  "Wrench",
  <>
    <path opacity={SOFT} d="M13.6 9.1 3.9 18.8a1.85 1.85 0 0 0 2.62 2.62l9.7-9.7Z" />
    <path d="M21.1 6.4a.65.65 0 0 0-1.08-.28l-2.2 2.2-1.95-.32-.32-1.95 2.2-2.2a.65.65 0 0 0-.28-1.08 5.2 5.2 0 0 0-6.36 6.6 5.2 5.2 0 0 0 9.99-2.97Z" />
  </>
);

export const IconLaptop = drawn(
  "Laptop",
  <>
    <rect opacity={SOFT} x="4" y="4" width="16" height="11.5" rx="2.2" />
    <path d="M2 17.4c0-.47.38-.85.85-.85h18.3c.47 0 .85.38.85.85a2.35 2.35 0 0 1-2.35 2.35H4.35A2.35 2.35 0 0 1 2 17.4Z" />
  </>
);

export const IconMegaphone = drawn(
  "Megaphone",
  <>
    <path opacity={SOFT} d="m6 9.3 11.6-4.7a1 1 0 0 1 1.38.93v12.94a1 1 0 0 1-1.38.93L6 14.7Z" />
    <rect x="2.5" y="8.8" width="4" height="6.4" rx="1.7" />
    <path d="M6.7 15.3h2.4l.85 3.7a1 1 0 0 1-.98 1.22H7.8a1 1 0 0 1-.97-.76ZM20.4 10.6h.85a.75.75 0 0 1 0 1.5h-.85Z" />
  </>
);

export const IconBackspace = drawn(
  "Backspace",
  <>
    <path
      opacity={SOFT}
      d="M8.4 5h10.1A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5H8.4a2 2 0 0 1-1.52-.7L2.7 13.3a2 2 0 0 1 0-2.6l4.18-5A2 2 0 0 1 8.4 5Z"
    />
    <path d="M11.47 9.47a.75.75 0 0 1 1.06 0L14 10.94l1.47-1.47a.75.75 0 1 1 1.06 1.06L15.06 12l1.47 1.47a.75.75 0 1 1-1.06 1.06L14 13.06l-1.47 1.47a.75.75 0 0 1-1.06-1.06L12.94 12l-1.47-1.47a.75.75 0 0 1 0-1.06Z" />
  </>
);

export const IconWine = drawn(
  "Wine",
  <>
    <path opacity={SOFT} d="M6.8 3h10.4a.8.8 0 0 1 .8.86l-.38 4.2A5.65 5.65 0 0 1 12 13.2a5.65 5.65 0 0 1-5.62-5.14L6 3.86A.8.8 0 0 1 6.8 3Z" />
    <path d="M7.05 7.2h9.9l-.08.75A4.9 4.9 0 0 1 12 12.4a4.9 4.9 0 0 1-4.87-4.45Z" />
    <rect x="11.2" y="12.6" width="1.6" height="6.6" rx=".8" />
    <rect x="7.5" y="19" width="9" height="1.9" rx=".95" />
  </>
);

export const IconStethoscope = drawn(
  "Stethoscope",
  <>
    <path opacity={SOFT} d="M5.5 3.2v5a5 5 0 0 0 10 0v-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
    <path d="M10.5 13.3v2.4a4.4 4.4 0 0 0 8.8 0v-2.2" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    <circle cx="19.3" cy="11.2" r="2.6" />
    <circle cx="5.5" cy="3.2" r="1.4" />
    <circle cx="15.5" cy="3.2" r="1.4" />
  </>
);

export const IconHotel = drawn(
  "Hotel",
  <>
    <rect opacity={SOFT} x="4" y="2.5" width="16" height="19" rx="3" />
    <rect x="8.3" y="6.5" width="1.7" height="7.2" rx=".85" />
    <rect x="14" y="6.5" width="1.7" height="7.2" rx=".85" />
    <rect x="8.3" y="9.25" width="7.4" height="1.7" rx=".85" />
    <rect x="10.2" y="16.3" width="3.6" height="5.2" rx="1" />
  </>
);

export const IconBookOpen = drawn(
  "BookOpen",
  <>
    <path opacity={SOFT} d="M2.5 5.3c3.05-.95 6.05-.62 8.75.98v13.35c-2.7-1.6-5.7-1.93-8.75-.98Z" />
    <path d="M21.5 5.3c-3.05-.95-6.05-.62-8.75.98v13.35c2.7-1.6 5.7-1.93 8.75-.98Z" />
  </>
);

export const IconHeartPulse = drawn(
  "HeartPulse",
  <>
    <path opacity={SOFT} d="M12 20.6S3.4 15.6 3.4 9.5A4.7 4.7 0 0 1 12 6.9a4.7 4.7 0 0 1 8.6 2.6c0 6.1-8.6 11.1-8.6 11.1Z" />
    <path d="M2.8 12.2h4.3l1.7-3.2 2.7 6.2 2.1-4.2h7.6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

export const IconFilm = drawn(
  "Film",
  <>
    <rect opacity={SOFT} x="3" y="4" width="18" height="16" rx="3.2" />
    <rect x="4.8" y="6.4" width="2.2" height="2.2" rx=".6" />
    <rect x="4.8" y="10.9" width="2.2" height="2.2" rx=".6" />
    <rect x="4.8" y="15.4" width="2.2" height="2.2" rx=".6" />
    <rect x="17" y="6.4" width="2.2" height="2.2" rx=".6" />
    <rect x="17" y="10.9" width="2.2" height="2.2" rx=".6" />
    <rect x="17" y="15.4" width="2.2" height="2.2" rx=".6" />
    <path d="M10.2 9.3v5.4a.65.65 0 0 0 1 .55l4.2-2.7a.65.65 0 0 0 0-1.1l-4.2-2.7a.65.65 0 0 0-1 .55Z" />
  </>
);

export const IconOffice = drawn(
  "Office",
  <>
    <rect opacity={SOFT} x="5" y="2.5" width="14" height="19" rx="2.6" />
    <rect x="8.1" y="5.8" width="2.4" height="2.4" rx=".6" />
    <rect x="13.5" y="5.8" width="2.4" height="2.4" rx=".6" />
    <rect x="8.1" y="9.9" width="2.4" height="2.4" rx=".6" />
    <rect x="13.5" y="9.9" width="2.4" height="2.4" rx=".6" />
    <rect x="8.1" y="14" width="2.4" height="2.4" rx=".6" />
    <rect x="13.5" y="14" width="2.4" height="2.4" rx=".6" />
    <rect x="10.6" y="17.6" width="2.8" height="3.9" rx=".7" />
  </>
);

/** Small check glyph (inside tiny badges: chosen font, theme, choice). */
export const IconCheckGlyph = drawn(
  "CheckGlyph",
  <path d="m5 12.6 4.4 4.4L19 7.4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
);

/** Small × glyph (remove a tag / a file). */
export const IconCloseGlyph = drawn(
  "CloseGlyph",
  <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
);

/* ---------- iconsax Bulk, by meaning ---------- */

// Navigation & chrome
export const IconHome = bulk(Home, "Home");
export const IconExpenses = bulk(ArrowSwapHorizontal, "Expenses");
export const IconWallet = bulk(Wallet, "Wallet");
export const IconSettings = bulk(Setting2, "Settings");
export const IconAdmin = bulk(ShieldTick, "Admin");
export const IconMenu = bulk(HambergerMenu, "Menu");
export const IconBell = bulk(Notification, "Bell");
export const IconBack = bulk(ArrowLeft2, "Back");
export const IconChevronRight = bulk(ArrowRight2, "ChevronRight");
export const IconChevronDown = bulk(ArrowDown2, "ChevronDown");
export const IconClose = bulk(CloseCircle, "Close");
export const IconMore = bulk(More, "More");
export const IconExternal = bulk(ExportSquare, "External");
export const IconCategories = bulk(Category2, "Categories");
export const IconReports = bulk(Chart2, "Reports");
export const IconFilter = bulk(Setting4, "Filter");

// Actions
export const IconAdd = bulk(Add, "Add");
export const IconMinus = bulk(Minus, "Minus");
export const IconScan = bulk(Scan, "Scan");
export const IconSearch = bulk(SearchNormal1, "Search");
export const IconEdit = bulk(Edit2, "Edit");
export const IconCopy = bulk(Copy, "Copy");
export const IconDelete = bulk(Trash, "Delete");
export const IconRestore = bulk(RotateLeft, "Restore");
export const IconSend = bulk(ArrowUp, "Send");
export const IconCamera = bulk(Camera, "Camera");
export const IconAttach = bulk(Paperclip2, "Attach");
export const IconPlay = bulk(Play, "Play");
export const IconPause = bulk(Pause, "Pause");
export const IconRepeat = bulk(Repeat, "Repeat");
export const IconArchive = bulk(Archive, "Archive");

// People & account
export const IconUser = bulk(Profile, "User");
export const IconUsers = bulk(Profile2User, "Users");
export const IconUserAdd = bulk(UserAdd, "UserAdd");
export const IconUserRemove = bulk(UserRemove, "UserRemove");
export const IconLock = bulk(Lock1, "Lock");
export const IconKey = bulk(Key, "Key");
export const IconFaceId = bulk(FingerScan, "FaceId");
export const IconLogin = bulk(Login, "Login");
export const IconLogout = bulk(Logout, "Logout");
export const IconMail = bulk(Sms, "Mail");
export const IconEye = bulk(Eye, "Eye");
export const IconEyeOff = bulk(EyeSlash, "EyeOff");
export const IconPalette = bulk(ColorSwatch, "Palette");
export const IconPhone = bulk(Mobile, "Phone");

// Status & states
export const IconSuccess = bulk(TickCircle, "Success");
export const IconWarning = bulk(Danger, "Warning");
export const IconError = bulk(Warning2, "Error");
export const IconInfo = bulk(InfoCircle, "Info");
export const IconCalendar = bulk(Calendar, "Calendar");
export const IconCalendarRepeat = bulk(CalendarTick, "CalendarRepeat");
export const IconClock = bulk(Clock, "Clock");
export const IconOffline = bulk(CloudCross, "Offline");
export const IconNoResults = bulk(SearchZoomOut, "NoResults");
export const IconQuestion = bulk(MessageQuestion, "Question");
export const IconFile = bulk(DocumentText, "File");
export const IconReceipt = bulk(ReceiptText, "Receipt");
export const IconGoal = bulk(Flag, "Goal");
export const IconSavings = bulk(Strongbox, "Savings");

/* ---------- the category icons (DB key = Lucide key, unchanged; 46 more keys added Nov 2026) ---------- */

export const CATEGORY_ICON_MAP: Record<string, SpIcon> = {
  plane: bulk(Airplane, "Plane"),
  car: bulk(Car, "Car"),
  bus: bulk(Bus, "Bus"),
  "train-front": IconTrain,
  fuel: bulk(GasStation, "Fuel"),
  "circle-parking": IconParking,
  hotel: IconHotel,
  bed: IconBed,
  utensils: IconUtensils,
  coffee: bulk(Coffee, "Coffee"),
  wine: IconWine,
  "shopping-cart": bulk(ShoppingCart, "ShoppingCart"),
  "shopping-bag": bulk(ShoppingBag, "ShoppingBag"),
  gift: bulk(Gift, "Gift"),
  smartphone: IconPhone,
  laptop: IconLaptop,
  monitor: bulk(Monitor, "Monitor"),
  wifi: bulk(Wifi, "Wifi"),
  package: bulk(Box, "Package"),
  truck: bulk(Truck, "Truck"),
  wrench: IconWrench,
  briefcase: bulk(Briefcase, "Briefcase"),
  "book-open": IconBookOpen,
  "graduation-cap": bulk(Teacher, "Graduation"),
  stethoscope: IconStethoscope,
  "heart-pulse": IconHeartPulse,
  dumbbell: IconDumbbell,
  ticket: bulk(Ticket, "Ticket"),
  film: IconFilm,
  music: bulk(Music, "Music"),
  receipt: IconReceipt,
  "credit-card": bulk(Card, "Card"),
  banknote: bulk(Money, "Money"),
  landmark: bulk(Bank, "Bank"),
  "building-2": IconOffice,
  house: IconHome,
  zap: bulk(Flash, "Electricity"),
  droplet: bulk(Drop, "Water"),
  "file-text": IconFile,
  printer: bulk(Printer, "Printer"),
  megaphone: IconMegaphone,
  users: IconUsers,
  tag: bulk(Tag, "Tag"),
  globe: bulk(Global, "Globe"),
  "map-pin": bulk(Location, "Location"),
  shirt: IconShirt,
  baby: IconBaby,
  dog: bulk(Pet, "Pet"),
  calendar: IconCalendar,
  ellipsis: IconMore,
  /* Tech (46 new keys, Nov 2026) */
  server: bulk(Driver, "Driver"),
  cloud: bulk(Cloud, "Cloud"),
  "cloud-services": bulk(CloudConnection, "CloudConnection"),
  code: bulk(Code1, "Code1"),
  "code-file": bulk(DocumentCode, "DocumentCode"),
  api: bulk(Hierarchy, "Hierarchy"),
  database: bulk(Layer, "Database"), // iconsax has no cylinder; "Data" draws a tree like "api"
  shield: bulk(ShieldTick, "ShieldTick"),
  lock: bulk(Lock, "Lock"),
  key: bulk(Key, "Key"),
  subscription: bulk(RepeatCircle, "RepeatCircle"),
  ai: bulk(Magicpen, "Magicpen"),
  design: bulk(PenTool, "PenTool"),
  palette: bulk(Brush2, "Brush2"),
  devices: bulk(Devices, "Devices"),
  keyboard: bulk(Keyboard, "Keyboard"),
  headphones: bulk(Headphone, "Headphone"),
  domain: bulk(Link2, "Link2"),
  internet: bulk(GlobalSearch, "GlobalSearch"),
  mail: bulk(Sms, "Sms"),
  chat: bulk(Messages, "Messages"),
  /* Business (46 new keys, Nov 2026) */
  ads: bulk(TrendUp, "TrendUp"),
  chart: bulk(Chart, "Chart"),
  freelancer: bulk(UserTick, "UserTick"),
  contractor: bulk(Personalcard, "Personalcard"),
  salary: bulk(WalletMoney, "WalletMoney"),
  tax: bulk(PercentageSquare, "PercentageSquare"),
  calculator: bulk(Calculator, "Calculator"),
  "bank-fee": bulk(ReceiptMinus, "ReceiptMinus"),
  course: bulk(Book1, "Book1"),
  idea: bulk(LampOn, "LampOn"),
  office: bulk(Building4, "Building4"),
  folder: bulk(Folder, "Folder"),
  archive: bulk(Archive, "Archive"),
  map: bulk(Map1, "Map1"),
  route: bulk(Routing, "Routing"),
  cake: bulk(Cake, "Cake"),
  /* Income (46 new keys, Nov 2026) */
  "client-payment": bulk(MoneyRecive, "MoneyRecive"),
  invoice: bulk(ReceiptText, "ReceiptText"),
  consulting: bulk(Profile2User, "Profile2User"),
  sales: bulk(Bag, "Bag"),
  refund: bulk(MoneyChange, "MoneyChange"),
  investment: bulk(Graph, "Graph"),
  coins: bulk(Coin1, "Coin1"),
  award: bulk(Award, "Award"),
  bonus: bulk(MoneyAdd, "MoneyAdd"),
};

/** Category icon by its DB key; unknown keys show the tag icon (like before). */
export function CategoryIconSp({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICON_MAP[name] ?? CATEGORY_ICON_MAP.tag;
  return <Icon className={cn("size-5", className)} />;
}

/* ---------- Lucide name → Spine icon (to swap old imports one for one) ---------- */

export const LUCIDE_TO_SP: Record<string, SpIcon> = {
  // chrome & navigation
  House: IconHome,
  ArrowLeftRight: IconExpenses,
  Wallet: IconWallet,
  Settings: IconSettings,
  Shield: IconAdmin,
  Menu: IconMenu,
  TextAlignStart: IconMenu,
  Bell: IconBell,
  ChevronLeft: IconBack,
  ChevronRight: IconChevronRight,
  ChevronRightIcon: IconChevronRight,
  ChevronDown: IconChevronDown,
  ChevronDownIcon: IconChevronDown,
  X: IconClose,
  XIcon: IconClose,
  Ellipsis: IconMore,
  ExternalLink: IconExternal,
  Shapes: IconCategories,
  ChartColumnBig: IconReports,
  SlidersHorizontal: IconFilter,
  // actions
  Plus: IconAdd,
  Minus: IconMinus,
  ScanLine: IconScan,
  Search: IconSearch,
  Pencil: IconEdit,
  Copy: IconCopy,
  Trash2: IconDelete,
  RotateCcw: IconRestore,
  ArrowUp: IconSend,
  Camera: IconCamera,
  Paperclip: IconAttach,
  Play: IconPlay,
  Pause: IconPause,
  Repeat: IconRepeat,
  Archive: IconArchive,
  Delete: IconBackspace,
  Check: IconCheckGlyph,
  CheckIcon: IconCheckGlyph,
  CheckCheck: IconSuccess,
  // people & account
  User: IconUser,
  Users: IconUsers,
  UserPlus: IconUserAdd,
  UserX: IconUserRemove,
  Lock: IconLock,
  KeyRound: IconKey,
  ScanFace: IconFaceId,
  Fingerprint: IconFaceId,
  LogIn: IconLogin,
  LogOut: IconLogout,
  Mail: IconMail,
  Eye: IconEye,
  EyeOff: IconEyeOff,
  Palette: IconPalette,
  Smartphone: IconPhone,
  // status
  CircleCheck: IconSuccess,
  AlertTriangle: IconWarning,
  TriangleAlert: IconWarning,
  CircleAlert: IconError,
  Calendar: IconCalendar,
  CalendarDays: IconCalendar,
  CalendarClock: IconCalendarRepeat,
  Clock: IconClock,
  CloudOff: IconOffline,
  SearchX: IconNoResults,
  FileQuestionMark: IconQuestion,
  FileText: IconFile,
  Receipt: IconReceipt,
  Target: IconGoal,
  PiggyBank: IconSavings,
  // categories (same icons as CATEGORY_ICON_MAP)
  Plane: CATEGORY_ICON_MAP.plane,
  Car: CATEGORY_ICON_MAP.car,
  Bus: CATEGORY_ICON_MAP.bus,
  TrainFront: IconTrain,
  Fuel: CATEGORY_ICON_MAP.fuel,
  CircleParking: IconParking,
  Hotel: CATEGORY_ICON_MAP.hotel,
  Bed: IconBed,
  Utensils: IconUtensils,
  Coffee: CATEGORY_ICON_MAP.coffee,
  Wine: CATEGORY_ICON_MAP.wine,
  ShoppingCart: CATEGORY_ICON_MAP["shopping-cart"],
  ShoppingBag: CATEGORY_ICON_MAP["shopping-bag"],
  ShoppingBasket: bulk(Bag2, "Basket"),
  Gift: CATEGORY_ICON_MAP.gift,
  Laptop: IconLaptop,
  Monitor: CATEGORY_ICON_MAP.monitor,
  Wifi: CATEGORY_ICON_MAP.wifi,
  Package: CATEGORY_ICON_MAP.package,
  Truck: CATEGORY_ICON_MAP.truck,
  Wrench: IconWrench,
  Briefcase: CATEGORY_ICON_MAP.briefcase,
  BookOpen: CATEGORY_ICON_MAP["book-open"],
  GraduationCap: CATEGORY_ICON_MAP["graduation-cap"],
  Stethoscope: CATEGORY_ICON_MAP.stethoscope,
  HeartPulse: CATEGORY_ICON_MAP["heart-pulse"],
  Dumbbell: IconDumbbell,
  Ticket: CATEGORY_ICON_MAP.ticket,
  Film: CATEGORY_ICON_MAP.film,
  Music: CATEGORY_ICON_MAP.music,
  CreditCard: CATEGORY_ICON_MAP["credit-card"],
  Banknote: CATEGORY_ICON_MAP.banknote,
  Landmark: CATEGORY_ICON_MAP.landmark,
  Building2: CATEGORY_ICON_MAP["building-2"],
  Zap: CATEGORY_ICON_MAP.zap,
  Droplet: CATEGORY_ICON_MAP.droplet,
  Printer: CATEGORY_ICON_MAP.printer,
  Megaphone: IconMegaphone,
  Tag: CATEGORY_ICON_MAP.tag,
  Globe: CATEGORY_ICON_MAP.globe,
  MapPin: CATEGORY_ICON_MAP["map-pin"],
  Shirt: IconShirt,
  Baby: IconBaby,
  Dog: CATEGORY_ICON_MAP.dog,
};
