// components/business/dashboard/RecentMessages.tsx
import React from 'react';
import { Mail, Clock, User, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  subject: string;
  timestamp: string;
  isRead: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface RecentMessagesProps {
  messages: Message[];
  onViewAllMessages?: () => void;
  onMessageClick?: (message: Message) => void;
  className?: string;
}

const RecentMessages: React.FC<RecentMessagesProps> = ({
  messages,
  onViewAllMessages,
  onMessageClick,
  className = ""
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-300';
    }
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
        {messages.length > 0 && (
          <button 
            onClick={onViewAllMessages}
            className="text-primary text-sm hover:text-primary-hover"
          >
            View All Messages
          </button>
        )}
      </div>

      {messages.length === 0 ? (
        // Empty State
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Messages</h4>
          <p className="text-gray-500 max-w-sm mx-auto">
            You're all caught up! New messages will appear here when they arrive.
          </p>
        </div>
      ) : (
        // Messages List
        <div className="space-y-3">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start justify-between p-4 bg-gray-50 rounded-lg border-l-4 cursor-pointer hover:bg-gray-100 transition-colors ${getPriorityColor(message.priority)}`}
              onClick={() => onMessageClick?.(message)}
            >
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">{message.from}</p>
                    {!message.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm truncate ${message.isRead ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                    {message.subject}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-right flex-shrink-0 ml-4">
                <Clock className="w-3 h-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentMessages;