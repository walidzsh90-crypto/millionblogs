"use client";

type ErrorStateProps = {
  title?: string;
  message?: string;
  reset?: () => void;
};

export function ErrorState({ title = "Something went wrong", message, reset }: ErrorStateProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {message ? <p className="text-sm leading-6 text-muted">{message}</p> : null}
      {reset ? (
        <button
          type="button"
          onClick={reset}
          className="w-fit rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          Try again
        </button>
      ) : null}
    </main>
  );
}
