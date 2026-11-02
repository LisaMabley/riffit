import { Button, StyleSheet, Text, View } from 'react-native';

import { useCurrentUser } from '../lib/session';
import { supabase, supabaseUrl } from '../lib/supabase';
import { isLocalUrl } from './localUrl';
import { SEED_PASSWORD, SEED_USERS, type SeedUser } from './seedUsers';

async function signInAsSeedUser({ email }: SeedUser) {
  if (!isLocalUrl(supabaseUrl)) {
    console.error(`Dev sign-in only works against a local stack, not ${supabaseUrl}.`);
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password: SEED_PASSWORD });
  if (error) {
    console.error(`Dev sign-in failed: ${error.message}. Has \`pnpm db:reset\` run?`);
  }
}

// Sessions live in memory, so this runs on every launch. It keeps the current user on a Fast Refresh.
export async function signInAtStartup() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await signInAsSeedUser(SEED_USERS[0]);
  }
}

export function DevUserSwitcher() {
  const user = useCurrentUser();

  return (
    <View style={styles.container}>
      <Text>Dev: sign in as</Text>
      {SEED_USERS.map((seedUser) => (
        <Button
          key={seedUser.email}
          title={seedUser.label}
          disabled={user?.email === seedUser.email}
          onPress={() => void signInAsSeedUser(seedUser)}
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
