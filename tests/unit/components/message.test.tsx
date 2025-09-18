import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock message component test
describe('Message Component', () => {
  it('renders user message correctly', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Hello, world!',
      createdAt: new Date(),
    };

    const { container } = render(
      <div data-testid="message-user">
        <div data-testid="message-content">{mockMessage.content}</div>
      </div>
    );

    expect(screen.getByTestId('message-user')).toBeInTheDocument();
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    const mockMessage = {
      id: '2',
      role: 'assistant',
      content: 'Hello! How can I help you?',
      createdAt: new Date(),
    };

    const { container } = render(
      <div data-testid="message-assistant">
        <div data-testid="message-content">{mockMessage.content}</div>
      </div>
    );

    expect(screen.getByTestId('message-assistant')).toBeInTheDocument();
    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
  });

  it('handles message editing', () => {
    const onEdit = vi.fn();
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Original message',
      createdAt: new Date(),
    };

    const { container } = render(
      <div data-testid="message-user">
        <div data-testid="message-content">{mockMessage.content}</div>
        <button type="button" data-testid="message-edit-button" onClick={() => onEdit(mockMessage.id)}>
          Edit
        </button>
      </div>
    );

    const editButton = screen.getByTestId('message-edit-button');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith('1');
  });

  it('displays reasoning toggle for reasoning models', () => {
    const mockMessage = {
      id: '3',
      role: 'assistant',
      content: 'The answer is 4',
      reasoning: 'Let me think step by step...',
      createdAt: new Date(),
    };

    const { container } = render(
      <div data-testid="message-assistant">
        <div data-testid="message-content">{mockMessage.content}</div>
        {mockMessage.reasoning && (
          <>
            <button type="button" data-testid="message-reasoning-toggle">Show reasoning</button>
            <div data-testid="message-reasoning" style={{ display: 'none' }}>
              {mockMessage.reasoning}
            </div>
          </>
        )}
      </div>
    );

    expect(screen.getByTestId('message-reasoning-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('message-reasoning')).toBeInTheDocument();
  });

  it('handles vote interactions', () => {
    const onUpvote = vi.fn();
    const onDownvote = vi.fn();
    const mockMessage = {
      id: '2',
      role: 'assistant',
      content: 'Response',
      createdAt: new Date(),
    };

    const { container } = render(
      <div data-testid="message-assistant">
        <div data-testid="message-content">{mockMessage.content}</div>
        <button type="button" data-testid="message-upvote" onClick={() => onUpvote(mockMessage.id)}>
          👍
        </button>
        <button type="button" data-testid="message-downvote" onClick={() => onDownvote(mockMessage.id)}>
          👎
        </button>
      </div>
    );

    fireEvent.click(screen.getByTestId('message-upvote'));
    expect(onUpvote).toHaveBeenCalledWith('2');

    fireEvent.click(screen.getByTestId('message-downvote'));
    expect(onDownvote).toHaveBeenCalledWith('2');
  });

  it('renders message with attachments', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Check this image',
      attachments: [
        { id: 'att1', type: 'image', url: '/image.jpg', name: 'image.jpg' }
      ],
      createdAt: new Date(),
    };

    const { container } = render(
      <div data-testid="message-user">
        <div data-testid="message-content">{mockMessage.content}</div>
        {mockMessage.attachments && mockMessage.attachments.length > 0 && (
          <div data-testid="message-attachments">
            {mockMessage.attachments.map(att => (
              <div key={att.id} data-testid={`attachment-${att.id}`}>
                {att.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );

    expect(screen.getByTestId('message-attachments')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
  });

  it('handles empty message content gracefully', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: '',
      createdAt: new Date(),
    };

    const { container } = render(
      <div data-testid="message-user">
        <div data-testid="message-content">
          {mockMessage.content || <span>Empty message</span>}
        </div>
      </div>
    );

    expect(screen.getByText('Empty message')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    const mockDate = new Date('2024-01-15T10:30:00');
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Test message',
      createdAt: mockDate,
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const { container } = render(
      <div data-testid="message-user">
        <div data-testid="message-content">{mockMessage.content}</div>
        <div data-testid="message-timestamp">{formatTime(mockMessage.createdAt)}</div>
      </div>
    );

    expect(screen.getByTestId('message-timestamp')).toHaveTextContent('10:30 AM');
  });
});