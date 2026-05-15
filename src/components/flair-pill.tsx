import { FLAIR_BY_ID, FLAIR_COLOR_CLASSES } from "@/lib/flair";

type Props = {
  id: string;
};

export function FlairPill({ id }: Props) {
  const flair = FLAIR_BY_ID[id];
  if (!flair) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${FLAIR_COLOR_CLASSES[flair.color]}`}
    >
      <span aria-hidden>{flair.emoji}</span>
      {flair.label}
    </span>
  );
}
