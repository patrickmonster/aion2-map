import React from 'react';
import './FloatingChatButton.css';

interface FloatingChatButtonProps {
  onClick: () => void;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick }) => {
  return (
    <button className="floating-chat-button" onClick={onClick} title="채팅">
      💬
    </button>
  );
};

export default FloatingChatButton;
