import { Redirect } from 'expo-router';

/**
 * Root index redirects to the Dictionary tab (default landing).
 */
export default function Index() {
  return <Redirect href={'/(tabs)/dictionary' as any} />;
}
