import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, User, Folder, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TagType {
  id: string;
  name: string;
  slug: string;
}

interface BlogCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    published_at: string | null;
    created_at: string;
    profiles?: {
      full_name: string | null;
    } | null;
    category?: Category | null;
    tags?: TagType[];
  };
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const date = post.published_at || post.created_at;

  if (featured) {
    return (
      <Link to={`/post/${post.slug}`} className="group block">
        <article className="relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
          {post.featured_image && (
            <div className="aspect-[21/9] overflow-hidden">
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {post.category && (
                <Badge variant="secondary" className="gap-1">
                  <Folder className="h-3 w-3" />
                  {post.category.name}
                </Badge>
              )}
              {post.tags && post.tags.length > 0 && post.tags.map(tag => (
                <Badge key={tag.id} variant="outline" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(date), 'MMMM d, yyyy')}
              </span>
              {post.profiles?.full_name && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.profiles.full_name}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            )}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/post/${post.slug}`} className="group block">
      <article className="h-full overflow-hidden rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
        {post.featured_image && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {post.category && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Folder className="h-3 w-3" />
                {post.category.name}
              </Badge>
            )}
            {post.tags && post.tags.slice(0, 2).map(tag => (
              <Badge key={tag.id} variant="outline" className="gap-1 text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(date), 'MMM d, yyyy')}
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {post.excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
