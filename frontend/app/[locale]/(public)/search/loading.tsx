import { Skeleton } from "@/shared/ui/skeleton/skeleton";

export default function SearchLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8" aria-busy="true">
      <div className="grid gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-12 w-full max-w-3xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </main>
  );
}
