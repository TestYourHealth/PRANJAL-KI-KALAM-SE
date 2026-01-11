import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { BlogCard } from '@/components/BlogCard';
import { CategoryTagFilter } from '@/components/CategoryTagFilter';
import { Loader2, BookOpen } from 'lucide-react';

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

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  category_id: string | null;
  profiles: {
    full_name: string | null;
  } | null;
  category: Category | null;
  tags: Tag[];
}

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, tagsRes] = await Promise.all([
        supabase.from('categories').select('id, name, slug').order('name'),
        supabase.from('tags').select('id, name, slug').order('name'),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (tagsRes.data) setTags(tagsRes.data);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);

      let query = supabase
        .from('posts')
        .select('id, title, slug, excerpt, featured_image, published_at, created_at, author_id, category_id')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (!error && data) {
        const authorIds = [...new Set(data.map(p => p.author_id))];
        const categoryIds = [...new Set(data.map(p => p.category_id).filter(Boolean))] as string[];
        const postIds = data.map(p => p.id);

        const [profilesRes, categoriesRes, postTagsRes] = await Promise.all([
          supabase.from('profiles').select('user_id, full_name').in('user_id', authorIds),
          categoryIds.length > 0 
            ? supabase.from('categories').select('id, name, slug').in('id', categoryIds)
            : Promise.resolve({ data: [] }),
          postIds.length > 0
            ? supabase.from('post_tags').select('post_id, tag_id').in('post_id', postIds)
            : Promise.resolve({ data: [] }),
        ]);

        const profileMap = new Map<string, string | null>(
          profilesRes.data?.map(p => [p.user_id, p.full_name] as [string, string | null]) || []
        );
        const categoryMap = new Map<string, Category>(
          categoriesRes.data?.map(c => [c.id, c] as [string, Category]) || []
        );

        // Get tag details
        const tagIds = [...new Set(postTagsRes.data?.map(pt => pt.tag_id) || [])];
        let tagMap = new Map<string, Tag>();
        if (tagIds.length > 0) {
          const { data: tagsData } = await supabase.from('tags').select('id, name, slug').in('id', tagIds);
          tagMap = new Map<string, Tag>(tagsData?.map(t => [t.id, t] as [string, Tag]) || []);
        }

        // Map post tags
        const postTagsMap = new Map<string, Tag[]>();
        postTagsRes.data?.forEach(pt => {
          const tag = tagMap.get(pt.tag_id);
          if (tag) {
            const existing = postTagsMap.get(pt.post_id) || [];
            postTagsMap.set(pt.post_id, [...existing, tag]);
          }
        });

        let postsWithDetails = data.map(post => ({
          ...post,
          profiles: { full_name: profileMap.get(post.author_id) || null },
          category: post.category_id ? categoryMap.get(post.category_id) || null : null,
          tags: postTagsMap.get(post.id) || [],
        }));

        // Filter by selected tags (client-side for simplicity)
        if (selectedTags.length > 0) {
          postsWithDetails = postsWithDetails.filter(post =>
            selectedTags.some(tagId => post.tags.some(t => t.id === tagId))
          );
        }

        setPosts(postsWithDetails);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [selectedCategory, selectedTags]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  return (
    <Layout>
      <section className="py-16 md:py-24 bg-gradient-to-b from-accent/30 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold hindi-text mb-6 text-primary">
              प्रांजल की कलम से
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground hindi-text mb-4">
              विचारों की अभिव्यक्ति, शब्दों का संगम
            </p>
            <p className="text-muted-foreground">A journey through thoughts, stories, and reflections</p>
            <div className="mt-8 flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <CategoryTagFilter
                categories={categories}
                tags={tags}
                selectedCategory={selectedCategory}
                selectedTags={selectedTags}
                onCategoryChange={setSelectedCategory}
                onTagToggle={handleTagToggle}
                onClearFilters={clearFilters}
              />
            </aside>

            <main className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No posts found</h2>
                  <p className="text-muted-foreground">Try adjusting your filters</p>
                </div>
              ) : (
                <>
                  {posts[0] && (
                    <div className="mb-12">
                      <BlogCard post={posts[0]} featured />
                    </div>
                  )}
                  {posts.length > 1 && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {posts.slice(1).map((post) => (
                        <BlogCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
