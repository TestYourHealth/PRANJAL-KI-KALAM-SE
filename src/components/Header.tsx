import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { PenLine, LogOut, User, Shield } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const { isWriter, isAdmin } = useUserRole();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="group">
            <h1 className="text-2xl md:text-3xl font-bold hindi-text text-primary transition-colors group-hover:text-primary/80">
              प्रांजल की कलम से
            </h1>
            <p className="text-xs text-muted-foreground">Pranjal Ki Kalam Se</p>
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            
            {user ? (
              <>
                {isWriter && (
                  <Link to="/write">
                    <Button variant="outline" size="sm" className="gap-2">
                      <PenLine className="h-4 w-4" />
                      Write
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="gap-2 text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="gap-2">
                  Writer Login
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
