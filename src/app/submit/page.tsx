import SubmissionForm from '@/components/submissions/SubmissionForm';

export default function SubmitPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1v6M5 4l3 3 3-3" />
              <rect x="2" y="9" width="12" height="5" rx="1" />
            </svg>
            Eaveside Task Tracker
          </div>
          <h1 className="mb-2 text-2xl font-bold">Submit a Request</h1>
          <p className="text-sm text-gray-400">
            Report a bug, request a feature, or suggest an improvement.
          </p>
        </div>

        <SubmissionForm />

        <p className="mt-4 text-center text-xs text-gray-500">
          Your request will be reviewed by our dev team.
        </p>
      </div>
    </div>
  );
}
