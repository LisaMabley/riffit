import type { Tables } from '@riffit/supabase';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { useCurrentUser } from '../lib/session';
import { supabase, supabaseUrl } from '../lib/supabase';
import { isLocalUrl } from './localUrl';
import { FIRST_USERNAME, SEED_PASSWORD, seedEmail } from './seedCredentials';
import { signInErrorMessage } from './signInError';

async function signInAs(username: string) {
  if (!isLocalUrl(supabaseUrl)) {
    console.error(`Dev sign-in only works against a local stack, not ${supabaseUrl}.`);
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: seedEmail(username),
    password: SEED_PASSWORD,
  });
  if (error) {
    console.error(signInErrorMessage(error, supabaseUrl));
  }
}

// Sessions live in memory, so this runs on every launch. It keeps the current user on a Fast Refresh.
export async function signInAtStartup() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await signInAs(FIRST_USERNAME);
  }
}

type SwitcherRow = Pick<Tables<'profiles'>, 'id' | 'username' | 'display_name'>;

export function DevUserSwitcher() {
  const userId = useCurrentUser()?.id;
  const [users, setUsers] = useState<SwitcherRow[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('id, username, display_name')
      .order('username')
      .then(({ data, error }) => {
        if (error) console.error(`Couldn't list the test users: ${error.message}`);
        setUsers(data ?? []);
      });
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text>Dev: sign in as</Text>
      {users.map((user) => (
        <Button
          key={user.id}
          title={user.display_name}
          disabled={user.id === userId}
          onPress={() => void signInAs(user.username)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 24,
  },
});
