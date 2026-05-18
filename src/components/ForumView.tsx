import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Heart, Send, User, ChevronLeft, Image as ImageIcon, Search, Edit2, Trash2, X } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useUser } from "../context/UserContext";

interface Post {
  id: number;
  title: string;
  content: string;
  likes_count: number;
  created_at: string;
  author: string;
  user_id: number;
  comment_count: number;
  user_liked: boolean;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: string;
  user_id: number;
}

const CLOUD_NAME = "dt1ridsu5";
const UPLOAD_PRESET = "sister_preset";

export const ForumView = () => {
  const { session } = useUser();
  const currentUserId = session?.user?.id;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [uploading, setUploading] = useState(false);

  // Comment Form state
  const [newComment, setNewComment] = useState("");
  const [commentUploading, setCommentUploading] = useState(false);

  // Edit states
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState("");

  const [viewingUser, setViewingUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);

  const loadUserProfile = async (userId: number) => {
    setLoadingUser(true);
    setViewingUser(true);
    setSelectedPost(null);
    try {
      const data = await apiFetch(`/forum.php?action=get_user_profile&user_id=${userId}`);
      if (!data.error) {
        setViewingUser({ id: data.id, email: data.email, name: data.name, bio: data.bio, created_at: data.created_at });
        setUserPosts(data.posts || []);
      } else {
        setViewingUser(null);
      }
    } catch (e) {
      console.error(e);
      setViewingUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchPosts = async () => {
    try {
      let url = '/forum.php?action=list';
      if (debouncedSearch.startsWith('#')) {
        url += `&tag=${encodeURIComponent(debouncedSearch.substring(1))}`;
      } else if (debouncedSearch) {
        url += `&q=${encodeURIComponent(debouncedSearch)}`;
      }
      const data = await apiFetch(url);
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [debouncedSearch]);

  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    try {
      const res = await apiFetch('/forum.php?action=like', {
        method: 'POST',
        body: JSON.stringify({ post_id: postId })
      });
      if (res.success) {
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              user_liked: res.liked,
              likes_count: res.liked ? p.likes_count + 1 : p.likes_count - 1
            };
          }
          return p;
        }));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({
            ...selectedPost,
            user_liked: res.liked,
            likes_count: res.liked ? selectedPost.likes_count + 1 : selectedPost.likes_count - 1
          });
        }
      }
    } catch (e) {
      console.error("Like failed", e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isComment = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    isComment ? setCommentUploading(true) : setUploading(true);

    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.secure_url) {
        if (isComment) {
          setNewComment(prev => prev + (prev ? '\n\n' : '') + `![image](${data.secure_url})`);
        } else {
          setNewContent(prev => prev + (prev ? '\n\n' : '') + `![image](${data.secure_url})`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    } finally {
      isComment ? setCommentUploading(false) : setUploading(false);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    try {
      await apiFetch('/forum.php?action=create', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      setNewTitle("");
      setNewContent("");
      fetchPosts();
    } catch (e) {
      console.error("Create failed", e);
    }
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiFetch('/forum.php?action=delete_post', {
        method: 'POST',
        body: JSON.stringify({ id: postId })
      });
      if (selectedPost?.id === postId) setSelectedPost(null);
      fetchPosts();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleEditPost = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!editPostContent.trim()) return;
    try {
      await apiFetch('/forum.php?action=edit_post', {
        method: 'POST',
        body: JSON.stringify({ id: postId, content: editPostContent })
      });
      setEditingPostId(null);
      fetchPosts();
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, content: editPostContent });
      }
    } catch (e) {
      console.error("Edit failed", e);
    }
  };

  const loadPostDetails = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const data = await apiFetch(`/forum.php?action=get_post&id=${post.id}`);
      setComments(data.comments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    try {
      await apiFetch('/forum.php?action=comment', {
        method: 'POST',
        body: JSON.stringify({ post_id: selectedPost.id, content: newComment })
      });
      setNewComment("");
      loadPostDetails(selectedPost);
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p));
    } catch (e) {
      console.error("Comment failed", e);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await apiFetch('/forum.php?action=delete_comment', {
        method: 'POST',
        body: JSON.stringify({ id: commentId })
      });
      if (selectedPost) {
        loadPostDetails(selectedPost);
        setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comment_count: p.comment_count - 1 } : p));
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Just now" : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  };

  const renderRichText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(!\[.*?\]\(.*?\)|#[a-zA-Z0-9_\u4e00-\u9fa5]+|@[a-zA-Z0-9_.-]+|https?:\/\/[^\s]+)/g);
    return (
      <div className="whitespace-pre-wrap font-sans">
        {parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('![') && part.includes('](')) {
            const urlMatch = part.match(/!\[.*?\]\((.*?)\)/);
            if (urlMatch && urlMatch[1]) {
              return <img key={i} src={urlMatch[1]} alt="Attached" className="mt-3 rounded-xl max-h-80 w-auto object-contain border border-border bg-black/20" loading="lazy" />;
            }
          } else if (part.startsWith('#')) {
            return <span key={i} className="text-primary font-medium hover:underline cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); setSearchQuery(part); }}>{part}</span>;
          } else if (part.startsWith('@')) {
            return <span key={i} className="text-pink-500 font-medium hover:underline cursor-pointer transition-colors">{part}</span>;
          } else if (part.startsWith('http')) {
            const ytMatch = part.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            if (ytMatch && ytMatch[1]) {
              return (
                <div key={i} className="mt-3 relative w-full pt-[56.25%] rounded-xl overflow-hidden">
                  <iframe className="absolute top-0 left-0 w-full h-full" src={`https://www.youtube.com/embed/${ytMatch[1]}`} allowFullScreen />
                </div>
              );
            }
            return <a key={i} href={part} target="_blank" rel="noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>{part}</a>;
          }
          return <span key={i} style={{ wordBreak: 'break-word' }}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col max-w-4xl mx-auto relative h-[85vh] bg-card border border-border rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Header & Search */}
      <div className="p-4 md:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/80 backdrop-blur-md z-10 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><MessageSquare className="text-primary" /> Community</h2>
          <p className="text-sm text-muted-foreground mt-1">Share insights, charts, and discussion</p>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search keywords or #tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-full py-2 pl-9 pr-8 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative bg-background">
        <AnimatePresence mode="wait">
          {viewingUser && viewingUser !== true ? (
            <motion.div
              key="userProfile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full bg-card"
            >
              <div className="sticky top-0 bg-card/90 backdrop-blur-md border-b border-border/50 p-4 flex items-center z-20">
                <button onClick={() => setViewingUser(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ChevronLeft size={20} /> Back to Forum
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full pb-32">
                <div className="p-6 md:p-10 border-b border-border flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-border text-foreground flex items-center justify-center text-3xl font-bold mb-4">
                    {(viewingUser.name || viewingUser.email).charAt(0).toUpperCase()}
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{viewingUser.name || viewingUser.email.split('@')[0]}</h1>
                  <p className="text-sm text-muted-foreground mb-4">Joined {formatDate(viewingUser.created_at)}</p>
                  {viewingUser.bio ? (
                    <div className="text-foreground max-w-lg mx-auto bg-card-hover p-4 rounded-xl border border-border/50 text-left">
                      {renderRichText(viewingUser.bio)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">This user hasn't written a bio yet.</p>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-4 text-foreground">Posts by this user</h3>
                  <div className="divide-y divide-border/50 border border-border rounded-xl overflow-hidden bg-card">
                    {loadingUser ? <p className="p-4 text-muted-foreground">Loading...</p> : userPosts.length === 0 ? <p className="p-4 text-muted-foreground">No posts.</p> : userPosts.map(post => (
                      <div key={post.id} onClick={() => {setViewingUser(null); loadPostDetails(post);}} className="p-4 hover:bg-card-hover cursor-pointer transition-colors">
                        <div className="flex justify-between mb-1"><span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span></div>
                        {post.title && <h4 className="font-bold text-foreground mb-1">{post.title}</h4>}
                        <div className="text-sm text-muted-foreground line-clamp-3">{renderRichText(post.content)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !selectedPost ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col max-w-2xl mx-auto w-full pb-20"
            >
              {/* Compose Post Box (Threads style) */}
              <div className="bg-card border-b border-border/50 p-4 sm:p-6 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold shrink-0">
                  {session?.user?.email?.charAt(0).toUpperCase() || <User size={20} />}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{session?.user?.email?.split('@')[0] || "You"}</span>
                  </div>
                  {/* Optional Title input, shown only if user starts typing it, or just keep it minimal */}
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-transparent text-foreground font-bold text-lg outline-none placeholder:text-neutral-600 w-full"
                  />
                  <textarea
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="What's on your mind? Use #tags or @mentions"
                    className="w-full bg-transparent text-neutral-200 outline-none resize-none min-h-[60px] text-base placeholder:text-muted-foreground"
                  />

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                        <ImageIcon size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, false)} disabled={uploading} />
                      </label>
                      {uploading && <span className="text-xs text-primary animate-pulse">Uploading image...</span>}
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newContent.trim() || uploading}
                      className="bg-white text-black hover:bg-gray-200 px-5 py-1.5 rounded-full font-bold text-sm transition-colors disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Feed List */}
              {loading ? (
                <div className="flex justify-center py-20 text-primary"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">No posts found.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {posts.map(post => (
                    <div
                      key={post.id}
                      onClick={() => loadPostDetails(post)}
                      className="p-4 sm:p-6 hover:bg-card cursor-pointer transition-colors flex gap-4 group"
                    >
                      {/* Avatar Col */}
                      <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); loadUserProfile(post.user_id); }}>
                        <div className="w-10 h-10 rounded-full bg-border text-muted-foreground flex items-center justify-center font-bold text-sm">
                          {post.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="w-0.5 flex-1 bg-border/50 group-hover:bg-border my-1 rounded-full"></div>
                      </div>

                      {/* Content Col */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); loadUserProfile(post.user_id); }}>{post.author.split('@')[0]}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                          </div>

                          {currentUserId === post.user_id && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); setEditingPostId(post.id); setEditPostContent(post.content); }} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={14} /></button>
                              <button onClick={(e) => handleDeletePost(e, post.id)} className="text-muted-foreground hover:text-danger p-1"><Trash2 size={14} /></button>
                            </div>
                          )}
                        </div>

                        {post.title && <h3 className="font-bold text-foreground mb-1.5">{post.title}</h3>}

                        {editingPostId === post.id ? (
                          <div className="mt-2" onClick={e => e.stopPropagation()}>
                            <textarea className="w-full bg-card-hover border border-primary/50 rounded-xl p-3 text-foreground outline-none min-h-[100px]" value={editPostContent} onChange={e => setEditPostContent(e.target.value)} />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => setEditingPostId(null)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                              <button onClick={(e) => handleEditPost(e, post.id)} className="px-3 py-1 text-xs bg-primary text-white rounded-lg">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm leading-relaxed mb-3">
                            {renderRichText(post.content)}
                          </div>
                        )}

                        <div className="flex items-center gap-5 mt-1">
                          <button
                            onClick={(e) => handleLike(e, post.id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${post.user_liked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-400'}`}
                          >
                            <Heart size={16} fill={post.user_liked ? "currentColor" : "none"} className={post.user_liked ? "scale-110" : ""} />
                            {post.likes_count > 0 && post.likes_count}
                          </button>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                            <MessageSquare size={16} /> {post.comment_count > 0 && post.comment_count}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="post"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full bg-card"
            >
              <div className="sticky top-0 bg-card/90 backdrop-blur-md border-b border-border/50 p-4 flex items-center z-20">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <ChevronLeft size={20} /> Thread
                </button>
              </div>

              <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full pb-32">
                {/* Original Post */}
                <div className="p-4 sm:p-6 border-b border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-border text-muted-foreground flex items-center justify-center font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => loadUserProfile(selectedPost.user_id)}>
                        {selectedPost.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-foreground block cursor-pointer hover:underline" onClick={() => loadUserProfile(selectedPost.user_id)}>{selectedPost.author.split('@')[0]}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(selectedPost.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPost.title && <h1 className="text-xl font-bold text-foreground mb-3">{selectedPost.title}</h1>}

                  <div className="text-foreground text-base leading-relaxed mb-6">
                    {renderRichText(selectedPost.content)}
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-border/50">
                    <button
                      onClick={(e) => handleLike(e, selectedPost.id)}
                      className={`flex items-center gap-2 transition-colors font-medium ${selectedPost.user_liked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-400'}`}
                    >
                      <Heart size={20} fill={selectedPost.user_liked ? "currentColor" : "none"} />
                      {selectedPost.likes_count}
                    </button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageSquare size={20} /> {selectedPost.comment_count} replies
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="divide-y divide-border/50">
                  {loadingComments ? (
                    <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div></div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No replies yet. Start the conversation!</div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="p-4 sm:p-6 flex gap-4 group">
                        <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => loadUserProfile(comment.user_id)}>
                          <div className="w-8 h-8 rounded-full bg-card-hover text-muted-foreground flex items-center justify-center font-bold text-xs">
                            {comment.author.charAt(0).toUpperCase()}
                          </div>
                          <div className="w-0.5 flex-1 bg-border/30 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm cursor-pointer hover:underline" onClick={() => loadUserProfile(comment.user_id)}>{comment.author.split('@')[0]}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                            </div>
                            {currentUserId === comment.user_id && (
                              <button onClick={() => handleDeleteComment(comment.id)} className="text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm leading-relaxed mb-2">
                            {renderRichText(comment.content)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fixed Comment Input at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 z-20">
                <div className="max-w-2xl mx-auto flex items-end gap-3 bg-card rounded-2xl border border-border p-2 focus-within:border-primary/50 transition-colors shadow-lg">
                  <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors p-2 shrink-0">
                    <ImageIcon size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, true)} disabled={commentUploading} />
                  </label>

                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder={commentUploading ? "Uploading image..." : `Reply to ${selectedPost.author.split('@')[0]}...`}
                    className="w-full bg-transparent text-foreground outline-none resize-none min-h-[40px] max-h-[120px] py-2 text-sm"
                    rows={newComment.split('\n').length > 1 ? Math.min(newComment.split('\n').length, 5) : 1}
                  />

                  <button
                    onClick={handleCreateComment}
                    disabled={!newComment.trim() || commentUploading}
                    className="bg-white text-black p-2.5 rounded-xl disabled:opacity-50 hover:bg-gray-200 transition-colors shrink-0 mb-0.5"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
