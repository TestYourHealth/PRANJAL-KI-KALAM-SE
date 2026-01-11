-- Create categories table
CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create tags table
CREATE TABLE public.tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create post_tags junction table for many-to-many relationship
CREATE TABLE public.post_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    UNIQUE (post_id, tag_id)
);

-- Add category_id to posts (one category per post)
ALTER TABLE public.posts ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Tags are viewable by everyone
CREATE POLICY "Tags are viewable by everyone"
ON public.tags FOR SELECT
USING (true);

-- Writers and admins can create tags
CREATE POLICY "Writers can create tags"
ON public.tags FOR INSERT
WITH CHECK (has_role(auth.uid(), 'writer') OR has_role(auth.uid(), 'admin'));

-- Admins can manage all tags
CREATE POLICY "Admins can manage tags"
ON public.tags FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Post tags are viewable by everyone
CREATE POLICY "Post tags are viewable by everyone"
ON public.post_tags FOR SELECT
USING (true);

-- Writers can manage tags on their own posts
CREATE POLICY "Writers can manage their post tags"
ON public.post_tags FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_tags.post_id 
        AND posts.author_id = auth.uid()
    )
    AND (has_role(auth.uid(), 'writer') OR has_role(auth.uid(), 'admin'))
);

-- Insert some default categories
INSERT INTO public.categories (name, slug, description) VALUES
('Technology', 'technology', 'Tech news and tutorials'),
('Lifestyle', 'lifestyle', 'Life tips and experiences'),
('Health', 'health', 'Health and wellness articles'),
('Business', 'business', 'Business and entrepreneurship'),
('Travel', 'travel', 'Travel guides and stories');

-- Insert some default tags
INSERT INTO public.tags (name, slug) VALUES
('Tutorial', 'tutorial'),
('News', 'news'),
('Tips', 'tips'),
('Review', 'review'),
('Guide', 'guide');