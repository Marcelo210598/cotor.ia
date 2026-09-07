import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton instantâneo enquanto a página do `/app` carrega no servidor. */
export default function AppLoading() {
  return (
    <div>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-4 h-7 w-64" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
