import React from 'react';
import './ChatModal.css';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()}>
        <div className="chat-header">
          <h2>채팅</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="chat-content">
          <iframe src="https://mobinogi.net/chat?room=aion2" title="Aion2 Chat" className="chat-iframe" frameBorder="0" allowFullScreen />
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
