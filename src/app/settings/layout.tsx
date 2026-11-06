import { AppShell } from '@/components/Layout';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell showMonthPicker={false} showNav>
      {children}
    </AppShell>
  );
}
