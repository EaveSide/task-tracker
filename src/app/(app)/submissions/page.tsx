import { Suspense } from 'react';
import SubmissionsView from '@/components/submissions/SubmissionsView';

// Suspense is required because SubmissionsView reads the ?type= search param.
export default function SubmissionsPage() {
  return (
    <Suspense>
      <SubmissionsView />
    </Suspense>
  );
}
