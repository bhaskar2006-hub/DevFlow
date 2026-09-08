import React, { useState } from 'react';
import { Comment, commentAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, Send, Trash2, Edit2, Check, X } from 'lucide-react';

interface CommentListProps {
  issueId: string;
  comments: Comment[];
  onCommentUpdated: () => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  issueId,
  comments,
  onCommentUpdated,
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      await commentAPI.create({ issueId, content: newComment.trim() });
      setNewComment('');
      onCommentUpdated();
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await commentAPI.update(id, { content: editContent.trim() });
      setEditingId(null);
      onCommentUpdated();
    } catch (err) {
      console.error('Failed to update comment', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentAPI.delete(id);
      onCommentUpdated();
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <span>Activity & Discussion ({comments.length})</span>
      </div>

      {/* New Comment Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Leave a comment or update..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 disabled:opacity-50 transition-all shadow-xs shadow-indigo-200"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </form>

      {/* List of comments */}
      <div className="space-y-4 pt-2">
        {comments.map((comment) => {
          const isAuthor = user?.id === comment.authorId?.id;
          const isEditing = editingId === comment.id;

          return (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {comment.authorId?.name ? comment.authorId.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-800">
                      {comment.authorId?.name || 'Unknown User'}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {new Date(comment.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {isAuthor && !isEditing && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg flex items-center space-x-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-lg flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-9">
                  {comment.content}
                </p>
              )}
            </div>
          );
        })}

        {comments.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-400">
            No comments yet. Start the conversation!
          </div>
        )}
      </div>
    </div>
  );
};
