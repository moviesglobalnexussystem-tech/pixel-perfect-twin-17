// Helper to compute relative date badge for newly uploaded content
export const getContentDateBadge = (createdAt?: string | null): string | null => {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return `${diffDays} days ago`;
  return null; // older than 1 week → no badge
};
