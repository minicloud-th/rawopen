export const memberPaths = {
  dashboard: '/dashboard',
  favorites: '/dashboard/saved',
  cart: '/dashboard/cart',
  topup: '/dashboard/topup',
  seller: '/dashboard/store',
  notifications: '/dashboard/notifications',
  help: '/dashboard/help',
  security: '/dashboard/security',
  account: '/account',
  settingsGeneral: '/account/general',
  settingsAppearance: '/account/appearance',
  settingsPrivacy: '/account/privacy',
  settingsShop: '/account/shop',
  settingsWallet: '/account/wallet',
  settingsSupport: '/account/support',
  settingsLegal: '/account/legal',
  profile: '/dashboard/profile',
  sellerApply: '/dashboard/seller-apply',
} as const;

export type MemberPage = keyof typeof memberPaths;
export type MemberPath = (typeof memberPaths)[MemberPage];

export const memberTitles: Record<MemberPage, string> = {
  dashboard: 'หน้าหลัก', favorites: 'รายการที่บันทึก', cart: 'ตะกร้า', topup: 'เติมเงิน',
  seller: 'ร้านค้าของฉัน', notifications: 'การแจ้งเตือน', help: 'ช่วยเหลือ',
  security: 'ความปลอดภัย', account: 'ตั้งค่าบัญชี',
  settingsGeneral: 'การตั้งค่าทั่วไป', settingsAppearance: 'รูปลักษณ์', settingsPrivacy: 'จัดการข้อมูล',
  settingsShop: 'ร้านค้าของฉัน', settingsWallet: 'กระเป๋าเงิน', settingsSupport: 'ความช่วยเหลือ', settingsLegal: 'ข้อมูลทางกฎหมาย',
  profile: 'โปรไฟล์ของฉัน',sellerApply:'สมัครผู้ขาย',
};

export function getMemberPage(path: string): MemberPage | undefined {
  return (Object.keys(memberPaths) as MemberPage[]).find(page => memberPaths[page] === path);
}

const settingsPages = ['account', 'security', 'settingsGeneral', 'settingsAppearance', 'settingsPrivacy', 'settingsShop',
  'settingsWallet', 'settingsSupport', 'settingsLegal'] as const satisfies readonly MemberPage[];
export type SettingsPage = typeof settingsPages[number];

export function isSettingsPage(page: MemberPage): page is SettingsPage {
  return settingsPages.some(candidate => candidate === page);
}
