import { BIO_MAX } from '@riffit/core';
import { Text } from 'react-native';

import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import { SupabaseCheck } from '../../components/SupabaseCheck';

export default function Feed() {
  return (
    <PlaceholderScreen message="Looks will show up here.">
      {/* Proves shared packages bundle through Metro. Goes away with the first real screen. */}
      <Text>Bio limit from @riffit/core: {BIO_MAX}</Text>
      <SupabaseCheck />
    </PlaceholderScreen>
  );
}
