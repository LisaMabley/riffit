import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { supabase } from '../lib/supabase';

// Signed-out requests to profiles are refused, but any answer proves the phone reached the stack.
// A network failure has status 0. Goes away with the first real screen.
export function SupabaseCheck() {
  const [message, setMessage] = useState('checking…');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id', { head: true })
      .then(({ status }) => setMessage(status === 0 ? 'not reached' : `reached (${status})`));
  }, []);

  return <Text>Supabase: {message}</Text>;
}
