interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#7C3AED', '#818CF8', '#34D399', '#F472B6', '#FB923C', '#F59E0B'];
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, url, size = 28, className = '' }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-medium shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: stringToColor(name),
        fontSize: size * 0.4,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export function EmptyAvatar({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`rounded-full border-2 border-dashed border-text-muted flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-text-muted" style={{ fontSize: size * 0.5 }}>?</span>
    </div>
  );
}
