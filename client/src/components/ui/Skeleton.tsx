interface Props {
  className?: string;
}

export default function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`bg-zinc-800 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}
