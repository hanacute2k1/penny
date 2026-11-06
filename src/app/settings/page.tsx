import { SettingsView } from '@/components/Settings';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return (
    <SettingsView email={data.user?.email ?? null} isGuest={Boolean(data.user?.is_anonymous)} />
  );
}
