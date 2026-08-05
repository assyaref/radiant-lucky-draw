import { useAuth } from './AuthContext';

export function DevelopmentModeBanner() {
  const { isMockAuthentication } = useAuth();

  if (!isMockAuthentication) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs"
      role="status"
    >
      <span className="font-bold tracking-[0.16em] text-amber-300">DEVELOPMENT MODE</span>
      <span className="text-amber-100/80">Mock Authentication Enabled</span>
    </div>
  );
}
