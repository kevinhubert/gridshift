import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

function messageFromError(err: unknown): string {
  if (isRouteErrorResponse(err)) return err.statusText || `Error ${err.status}`;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export default function RouteError() {
  const err = useRouteError();
  const message = messageFromError(err);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-lg font-semibold text-foreground">Unexpected error</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        onClick={() => window.location.reload()}
      >
        Reload page
      </button>
    </div>
  );
}
