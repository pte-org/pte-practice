export default function StudentLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      Loading your practice workspace…
    </div>
  );
}
