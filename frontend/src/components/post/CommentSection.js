import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const CommentSection = ({ comments = [], onAddComment }) => {
  const { user } = useAuth();
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;

    const newComment = {
      id: Date.now(),
      author: user?.name || "User",
      text,
      createdAt: new Date(),
    };

    onAddComment(newComment);
    setText("");
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Input */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
          {user?.name?.charAt(0)}
        </div>

        <input
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-gray-100 px-3 py-2 rounded-full text-sm outline-none"
        />

        <button
          onClick={handleSubmit}
          className="text-blue-600 text-sm font-semibold hover:underline"
        >
          Post
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
              {comment.author.charAt(0)}
            </div>

            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <p className="text-sm font-semibold text-gray-800">
                {comment.author}
              </p>
              <p className="text-sm text-gray-700">{comment.text}</p>

              <p className="text-xs text-gray-400 mt-1">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
