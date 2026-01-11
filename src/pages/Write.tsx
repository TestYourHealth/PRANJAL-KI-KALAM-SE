import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Cloud, CloudOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CategoryTagSelector } from '@/components/CategoryTagSelector';
import { RichTextEditor } from '@/components/RichTextEditor';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function Write() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { isWriter, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [postId, setPostId] = useState<string | undefined>(id);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isWriter) {
      toast.error('You need writer permissions to access this page');
      navigate('/dashboard');
    }
  }, [isWriter, roleLoading, navigate]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('author_id', user.id)
        .maybeSingle();

      if (error || !data) {
        toast.error('Post not found');
        navigate('/dashboard');
        return;
      }

      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt || '');
      setFeaturedImage(data.featured_image || '');
      setPublished(data.published);
      setCategoryId(data.category_id || null);

      // Fetch post tags
      const { data: postTags } = await supabase
        .from('post_tags')
        .select('tag_id')
        .eq('post_id', id);

      if (postTags) {
        setSelectedTags(postTags.map((pt) => pt.tag_id));
      }

      setLoading(false);
    };

    if (id && user && isWriter) {
      fetchPost();
    }
  }, [id, user, isWriter, navigate]);

  // Autosave function
  const autoSave = useCallback(async () => {
    if (!user || !title.trim() || !content.trim() || !hasChangesRef.current) return;

    setAutoSaveStatus('saving');
    const slug = generateSlug(title);
    const postData = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      featured_image: featuredImage || null,
      published: false, // Autosave never publishes
      author_id: user.id,
      category_id: categoryId,
    };

    try {
      if (postId) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId);
        
        if (error) throw error;
      } else {
        // Create new draft
        const { data: newPost, error } = await supabase
          .from('posts')
          .insert(postData)
          .select('id')
          .single();
        
        if (error) throw error;
        if (newPost) {
          setPostId(newPost.id);
          // Update URL without navigation
          window.history.replaceState(null, '', `/write/${newPost.id}`);
        }
      }

      // Handle tags for autosave
      if (postId && selectedTags.length > 0) {
        await supabase.from('post_tags').delete().eq('post_id', postId);
        const tagInserts = selectedTags.map((tagId) => ({
          post_id: postId,
          tag_id: tagId,
        }));
        await supabase.from('post_tags').insert(tagInserts);
      }

      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      hasChangesRef.current = false;
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Autosave failed:', error);
    }
  }, [user, title, content, excerpt, featuredImage, categoryId, postId, selectedTags]);

  // Track changes
  useEffect(() => {
    hasChangesRef.current = true;
  }, [title, content, excerpt, featuredImage, categoryId, selectedTags]);

  // Autosave timer (every 30 seconds)
  useEffect(() => {
    if (authLoading || roleLoading || loading || !isWriter) return;

    autoSaveTimerRef.current = setInterval(() => {
      autoSave();
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, authLoading, roleLoading, loading, isWriter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const slug = generateSlug(title);
    const postData = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      featured_image: featuredImage || null,
      published,
      published_at: published ? new Date().toISOString() : null,
      author_id: user.id,
      category_id: categoryId,
    };

    let error;
    let savedPostId = postId;

    if (postId) {
      const { error: updateError } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', postId);
      error = updateError;
    } else {
      const { data: newPost, error: insertError } = await supabase
        .from('posts')
        .insert(postData)
        .select('id')
        .single();
      error = insertError;
      savedPostId = newPost?.id;
    }

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    // Handle tags
    if (savedPostId) {
      // Delete existing tags
      await supabase.from('post_tags').delete().eq('post_id', savedPostId);

      // Insert new tags
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map((tagId) => ({
          post_id: savedPostId,
          tag_id: tagId,
        }));
        await supabase.from('post_tags').insert(tagInserts);
      }
    }

    toast.success(postId ? 'Post updated!' : 'Post created!');
    navigate('/dashboard');
    setSaving(false);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastSaved.toLocaleTimeString();
  };

  if (authLoading || roleLoading || loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground gap-1 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">
              {postId ? 'Edit Post' : 'Write New Post'}
            </h1>
            
            {/* Autosave status indicator */}
            <div className="flex items-center gap-2 text-sm">
              {autoSaveStatus === 'saving' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <Cloud className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">
                    Saved {formatLastSaved()}
                  </span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <CloudOff className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Save failed</span>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief summary of your post"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="featuredImage">Featured Image URL (optional)</Label>
              <Input
                id="featuredImage"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
              />
            </div>

            <CategoryTagSelector
              categoryId={categoryId}
              selectedTags={selectedTags}
              onCategoryChange={setCategoryId}
              onTagsChange={setSelectedTags}
            />

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your amazing post..."
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="published" className="font-medium">Publish</Label>
                <p className="text-sm text-muted-foreground">
                  Make this post visible to everyone
                </p>
              </div>
              <Switch
                id="published"
                checked={published}
                onCheckedChange={setPublished}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                {id ? 'Update Post' : 'Save Post'}
              </Button>
              <Link to="/dashboard">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
