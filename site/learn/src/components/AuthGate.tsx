import { AuthPageShell, Button, Badge } from '@beskid/ui-react';
import { useEffect, useState } from 'react';
import { authHubLoginUrl, authHubProfileUrl, fetchAuthUser, logoutUser } from '#/lib/auth';
import type { AuthUser } from '#/lib/auth';

export interface AuthGateProps {
  children: (user: AuthUser | null) => React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGate({ children, requireAuth = false }: AuthGateProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Checking session…</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    return (
      <AuthPageShell
        kicker="Beskid"
        title="Learn"
        description="Sign in with GitHub through the Beskid auth hub to track your progress and access all lessons."
        footer={
          <a href={authHubProfileUrl()} className="underline-offset-4 hover:underline text-sm">
            Beskid account
          </a>
        }
      >
        <Button size="lg" asChild className="w-full">
          <a href={authHubLoginUrl()}>Sign in with GitHub</a>
        </Button>
      </AuthPageShell>
    );
  }

  return <>{children(user)}</>;
}

export function UserBadge({ user }: { user: AuthUser }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1.5">
        <img src={user.avatarUrl} alt="" className="size-4 rounded-full" />
        {user.login}
      </Badge>
      <Button variant="ghost" size="xs" onClick={() => logoutUser().then(() => window.location.reload())}>
        Log out
      </Button>
    </div>
  );
}
