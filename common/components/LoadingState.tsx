interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      {message}
    </div>
  );
}
