function getLoomId(url: string): string | null {
  const match = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/);
  return match ? match[1] : null;
}

export function LoomEmbed({ url }: { url: string }) {
  const id = getLoomId(url);
  if (!id) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={`https://www.loom.com/embed/${id}`}
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
