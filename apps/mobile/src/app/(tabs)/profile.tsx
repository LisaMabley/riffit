import type { Tables } from '@riffit/supabase';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import { devTools } from '../../dev';
import { useCurrentUser } from '../../lib/session';
import { supabase } from '../../lib/supabase';

type ProfileRow = Pick<Tables<'profiles'>, 'id' | 'username' | 'display_name' | 'bio'>;

export default function Profile() {
  const userId = useCurrentUser()?.id;
  const [loaded, setLoaded] = useState<ProfileRow | null>(null);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    supabase
      .from('profiles')
      .select('id, username, display_name, bio')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (stale) return;
        if (error) console.error(`Couldn't load the profile: ${error.message}`);
        setLoaded(data);
      });
    return () => {
      stale = true;
    };
  }, [userId]);

  // After switching users, the previous user's profile stays in state until the new one loads.
  const profile = loaded?.id === userId ? loaded : null;

  return (
    <PlaceholderScreen
      message={profile ? `@${profile.username}` : 'Your profile will show up here.'}
    >
      {profile && <Text>{profile.display_name}</Text>}
      {profile?.bio && <Text>{profile.bio}</Text>}
      {devTools && <devTools.DevUserSwitcher />}
    </PlaceholderScreen>
  );
}
