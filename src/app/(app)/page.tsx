import { redirect } from 'next/navigation';
import { defaultSpaceId } from '@/lib/spaces';

export default function Home() {
  redirect(`/s/${defaultSpaceId}/board`);
}
