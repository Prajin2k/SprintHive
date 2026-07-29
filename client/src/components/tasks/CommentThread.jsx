import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { socket } from '../../services/socket';
import api from '../../services/api';

const CommentThread = ({ taskId, projectId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/tasks/${taskId}/comments`);
        setComments(res.data?.data || res.data || []);
      } catch (err) {
        console.error('Failed to load comments');
      }
    };
    
    fetchComments();
    
    socket.emit('join:task', taskId);
    socket.on('comment:new', (comment) => {
      setComments(prev => [comment, ...prev]);
    });

    return () => {
      socket.emit('leave:task', taskId);
      socket.off('comment:new');
    };
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: newComment });
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
        {comments.map(c => (
          <div key={c._id} className="flex gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center shrink-0">
              {c.author?.avatar ? <img src={c.author.avatar} className="w-full h-full rounded-full" /> : (c.author?.name?.[0] || 'U')}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-surface-200">{c.author?.name}</span>
                <span className="text-xs text-surface-500">{formatDistanceToNow(new Date(c.createdAt))} ago</span>
              </div>
              <p className="text-surface-300 mt-1">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="mt-auto relative">
        <textarea 
          value={newComment} 
          onChange={e => setNewComment(e.target.value)}
          placeholder="Write a comment..." 
          className="input w-full min-h-[80px] resize-none pr-12 pb-10"
        />
        <button type="submit" className="absolute bottom-2 right-2 btn-primary btn-sm px-3 py-1">
          Send
        </button>
      </form>
    </div>
  );
};

export default CommentThread;
