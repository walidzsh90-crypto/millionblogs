import { Skeleton } from "@/shared/ui/skeleton/skeleton";

export default function ArticleLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:px-8" aria-busy="true">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-14 w-full max-w-3xl" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-36 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </main>
  );
}
