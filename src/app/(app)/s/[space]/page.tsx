import { redirect } from 'next/navigation';

export default async function SpaceIndex({
  params,
}: {
  params: Promise<{ space: string }>;
}) {
  const { space } = await params;
  redirect(`/s/${space}/board`);
}
