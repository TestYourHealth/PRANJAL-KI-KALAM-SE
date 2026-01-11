import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface CategoryTagFilterProps {
  categories: Category[];
  tags: Tag[];
  selectedCategory: string | null;
  selectedTags: string[];
  onCategoryChange: (categoryId: string | null) => void;
  onTagToggle: (tagId: string) => void;
  onClearFilters: () => void;
}

export function CategoryTagFilter({
  categories,
  tags,
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagToggle,
  onClearFilters,
}: CategoryTagFilterProps) {
  const hasFilters = selectedCategory || selectedTags.length > 0;

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filter Posts</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => onCategoryChange(selectedCategory === cat.id ? null : cat.id)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Tags</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.name}
              {selectedTags.includes(tag.id) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
