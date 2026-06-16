import { Skeleton } from "@/shared/ui/skeleton/skeleton";

export default function BlogLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8" aria-busy="true">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <Skeleton className="h-24 w-24 rounded-lg" />
        <div className="grid flex-1 gap-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-20 w-full max-w-3xl" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </main>
  );
}
