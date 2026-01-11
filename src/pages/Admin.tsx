import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, UserPlus, UserMinus, Loader2, FileText, 
  Eye, EyeOff, Trash2, Edit, Users 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

interface PostWithAuthor {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
  author_id: string;
  author_name: string | null;
}

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [postUpdating, setPostUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
      toast.error('Access denied. Admin only.');
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPosts();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (profilesError) throw profilesError;

      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const userRoles = (allRoles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role);
        
        return {
          id: profile.user_id,
          email: '',
          full_name: profile.full_name,
          roles: userRoles
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, title, slug, published, created_at, author_id')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get author profiles
      const authorIds = [...new Set((postsData || []).map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', authorIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      const postsWithAuthors: PostWithAuthor[] = (postsData || []).map(post => ({
        ...post,
        author_name: profileMap.get(post.author_id) || null
      }));

      setPosts(postsWithAuthors);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const toggleWriterRole = async (userId: string, hasWriterRole: boolean) => {
    setUpdating(userId);
    try {
      if (hasWriterRole) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'writer');

        if (error) throw error;
        toast.success('Writer role removed');
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'writer' });

        if (error) throw error;
        toast.success('Writer role assigned');
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const togglePostPublished = async (postId: string, currentlyPublished: boolean) => {
    setPostUpdating(postId);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          published: !currentlyPublished,
          published_at: !currentlyPublished ? new Date().toISOString() : null
        })
        .eq('id', postId);

      if (error) throw error;
      toast.success(currentlyPublished ? 'Post unpublished' : 'Post published');
      await fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    } finally {
      setPostUpdating(null);
    }
  };

  const deletePost = async (postId: string) => {
    setPostUpdating(postId);
    try {
      // First delete post tags
      await supabase.from('post_tags').delete().eq('post_id', postId);
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post deleted');
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setPostUpdating(null);
    }
  };

  if (roleLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Manage Writer Roles</CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No users found.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {users.map((u) => {
                      const hasWriterRole = u.roles.includes('writer');
                      const hasAdminRole = u.roles.includes('admin');
                      const isCurrentUser = u.id === user?.id;

                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">
                              {u.full_name || 'No Name'}
                              {isCurrentUser && (
                                <span className="text-xs text-muted-foreground ml-2">(You)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {u.id.slice(0, 8)}...
                            </p>
                            <div className="flex gap-2 mt-2">
                              {hasAdminRole && (
                                <Badge variant="default">Admin</Badge>
                              )}
                              {hasWriterRole && (
                                <Badge variant="secondary">Writer</Badge>
                              )}
                              {!hasAdminRole && !hasWriterRole && (
                                <Badge variant="outline">Reader</Badge>
                              )}
                            </div>
                          </div>

                          {!hasAdminRole && (
                            <Button
                              variant={hasWriterRole ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleWriterRole(u.id, hasWriterRole)}
                              disabled={updating === u.id}
                              className="gap-2"
                            >
                              {updating === u.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : hasWriterRole ? (
                                <>
                                  <UserMinus className="h-4 w-4" />
                                  Remove Writer
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4" />
                                  Make Writer
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Manage All Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : posts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No posts found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{post.title}</p>
                            <Badge variant={post.published ? "default" : "outline"}>
                              {post.published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            By {post.author_name || 'Unknown'} • {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePostPublished(post.id, post.published)}
                            disabled={postUpdating === post.id}
                            title={post.published ? 'Unpublish' : 'Publish'}
                          >
                            {postUpdating === post.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : post.published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            title="Edit"
                          >
                            <Link to={`/write/${post.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={postUpdating === post.id}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{post.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePost(post.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
