import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-2xl font-bold hindi-text text-primary mb-2">
          प्रांजल की कलम से
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          विचारों की अभिव्यक्ति, शब्दों का संगम
        </p>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          Made with <Heart className="h-3 w-3 text-primary fill-primary" /> in India
        </p>
      </div>
    </footer>
  );
}
