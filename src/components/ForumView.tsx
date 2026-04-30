import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Heart, Send, Plus, User, Clock, ChevronLeft } from "lucide-react";
import { apiFetch } from "../lib/api";

interface Post {
  id: number;
  title: string;
  content: string;
  likes_count: number;
  created_at: string;
  author: string;
  comment_count: number;
  user_liked: boolean;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: string;
}

export const ForumView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newComment, setNewComment] = useState("");

  const fetchPosts = async () => {
    try {
      const data = await apiFetch('/forum.php?action=list');
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await apiFetch('/forum.php?action=create', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      setIsCreating(false);
      setNewTitle("");
      setNewContent("");
      fetchPosts();
    } catch (e) {
      console.error("Create failed", e);
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
      // Refresh comments
      loadPostDetails(selectedPost);
      // Update comment count in main list
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p));
    } catch (e) {
      console.error("Comment failed", e);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Just now" : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-6 max-w-5xl mx-auto relative h-[85vh] overflow-hidden bg-card border border-border rounded-2xl shadow-lg"
    >
      {/* Header */}
      <div className="p-6 border-b border-border/50 flex items-center justify-between bg-card/80 backdrop-blur-md z-10">
        <div>
          <h2 className="text-2xl font-bold text-white">Community Discussion</h2>
          <p className="text-sm text-neutral-400 mt-1">Share strategies and market insights</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> New Topic
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
        <AnimatePresence mode="wait">
          {!selectedPost ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              {loading ? (
                <div className="flex justify-center py-20 text-primary"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 text-neutral-500">No discussions yet. Be the first to post!</div>
              ) : (
                posts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => loadPostDetails(post)}
                    className="bg-[#1a1a24] hover:bg-[#22222e] border border-transparent hover:border-border p-5 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 group"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{post.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 bg-black/20 px-2 py-1 rounded-md">
                        <User size={12} /> {post.author.split('@')[0]}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-400 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-6 mt-2">
                      <button 
                        onClick={(e) => handleLike(e, post.id)}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${post.user_liked ? 'text-pink-500' : 'text-neutral-500 hover:text-pink-400'}`}
                      >
                        <Heart size={16} fill={post.user_liked ? "currentColor" : "none"} /> {post.likes_count}
                      </button>
                      <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                        <MessageSquare size={16} /> {post.comment_count}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 ml-auto">
                        <Clock size={14} /> {formatDate(post.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="post"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full"
            >
              <button 
                onClick={() => setSelectedPost(null)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 w-fit transition-colors bg-[#1a1a24] px-3 py-1.5 rounded-lg"
              >
                <ChevronLeft size={18} /> Back to Discussions
              </button>

              <div className="bg-[#1a1a24] border border-border p-6 rounded-2xl mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-400 bg-black/30 px-3 py-1.5 rounded-lg">
                    <User size={16} className="text-primary" /> 
                    <span className="font-medium text-white">{selectedPost.author.split('@')[0]}</span>
                  </div>
                  <span className="text-xs text-neutral-500 flex items-center gap-1"><Clock size={14} /> {formatDate(selectedPost.created_at)}</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">{selectedPost.title}</h1>
                <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                <div className="mt-6 pt-4 border-t border-border/50">
                  <button 
                    onClick={(e) => handleLike(e, selectedPost.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${selectedPost.user_liked ? 'bg-pink-500/20 text-pink-500' : 'bg-black/30 text-neutral-400 hover:bg-black/50 hover:text-pink-400'}`}
                  >
                    <Heart size={18} fill={selectedPost.user_liked ? "currentColor" : "none"} /> 
                    {selectedPost.user_liked ? 'Liked' : 'Like'} ({selectedPost.likes_count})
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4 px-2">Comments</h3>
              
              <div className="flex flex-col gap-4 mb-6">
                {loadingComments ? (
                  <div className="text-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary inline-block"></div></div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 bg-[#13131a] rounded-xl border border-border/50">No comments yet.</div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-[#13131a] border border-border/50 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">{comment.author.split('@')[0]}</span>
                        <span className="text-xs text-neutral-600">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-neutral-300">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-auto bg-[#1a1a24] p-2 pl-4 rounded-xl border border-border flex items-end gap-2 focus-within:border-primary transition-colors">
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-transparent border-none text-white focus:outline-none resize-none py-2 text-sm max-h-[100px]"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateComment();
                    }
                  }}
                />
                <button 
                  onClick={handleCreateComment}
                  disabled={!newComment.trim()}
                  className="bg-primary text-white p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors shrink-0 m-1"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border shadow-2xl p-6 md:p-8 rounded-2xl w-full max-w-xl flex flex-col gap-4"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Create New Discussion</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase font-semibold ml-1">Topic Title</label>
                  <input 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="E.g. What's your outlook on tech stocks this week?"
                    className="w-full bg-[#13131a] border border-border rounded-xl p-3 text-white focus:border-primary outline-none mt-1 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase font-semibold ml-1">Content</label>
                  <textarea 
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Share your thoughts, analysis, or questions..."
                    className="w-full bg-[#13131a] border border-border rounded-xl p-3 text-white focus:border-primary outline-none mt-1 min-h-[150px] transition-colors resize-y"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#1a1a24] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreatePost}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
                >
                  Post Topic
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
