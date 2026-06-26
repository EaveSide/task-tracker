import { redirect } from 'next/navigation';
import { getSpacesServer } from '@/lib/spaces-server';
import { defaultSpaceId } from '@/lib/spaces';

export default async function Home() {
  const spaces = await getSpacesServer();
  redirect(`/s/${spaces[0]?.id ?? defaultSpaceId}/board`);
}
