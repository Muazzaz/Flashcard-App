import { Redirect } from 'expo-router';

/** Legacy route — redirects to Dictionary tab */
export default function Explore() {
  return <Redirect href={'/(tabs)/dictionary' as any} />;
}
