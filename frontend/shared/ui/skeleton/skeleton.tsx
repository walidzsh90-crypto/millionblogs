import { classNames } from "@/shared/utils/class-names";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={classNames("animate-pulse rounded-md bg-muted/20", className)} />;
}
