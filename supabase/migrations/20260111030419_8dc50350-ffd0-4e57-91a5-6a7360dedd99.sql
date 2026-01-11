-- Allow admins to view ALL posts (published and unpublished)
CREATE POLICY "Admins can view all posts" 
ON public.posts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any post
CREATE POLICY "Admins can update any post" 
ON public.posts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any post
CREATE POLICY "Admins can delete any post" 
ON public.posts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));