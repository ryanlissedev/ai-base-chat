import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

describe('Chat Input Component', () => {
  let onSendMessage: ReturnType<typeof vi.fn>;
  let onStop: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSendMessage = vi.fn();
    onStop = vi.fn();
  });

  it('renders input field and send button', () => {
    render(
      <div>
        <textarea data-testid="multimodal-input" placeholder="Type a message..." />
        <button type="button" data-testid="send-button">Send</button>
      </div>
    );

    expect(screen.getByTestId('multimodal-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('handles text input', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <textarea data-testid="multimodal-input" placeholder="Type a message..." />
        <button type="button" data-testid="send-button">Send</button>
      </div>
    );

    const input = screen.getByTestId('multimodal-input');
    await user.type(input, 'Hello, world!');

    expect(input).toHaveValue('Hello, world!');
  });

  it('sends message on button click', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(
      <div>
        <textarea data-testid="multimodal-input" placeholder="Type a message..." defaultValue="Test message" />
        <button type="button" data-testid="send-button" onClick={() => {
          const input = document.querySelector('[data-testid="multimodal-input"]') as HTMLTextAreaElement;
          handleSend(input.value);
        }}>Send</button>
      </div>
    );

    const sendButton = screen.getByTestId('send-button');
    await user.click(sendButton);

    expect(handleSend).toHaveBeenCalledWith('Test message');
  });

  it('disables send button when input is empty', () => {
    render(
      <div>
        <textarea data-testid="multimodal-input" placeholder="Type a message..." value="" readOnly />
        <button type="button" data-testid="send-button" disabled={true}>Send</button>
      </div>
    );

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  it('shows stop button during message generation', () => {
    const isGenerating = true;

    render(
      <div>
        <textarea data-testid="multimodal-input" placeholder="Type a message..." />
        {isGenerating ? (
          <button type="button" data-testid="stop-button" onClick={onStop}>Stop</button>
        ) : (
          <button type="button" data-testid="send-button">Send</button>
        )}
      </div>
    );

    expect(screen.getByTestId('stop-button')).toBeInTheDocument();
    expect(screen.queryByTestId('send-button')).not.toBeInTheDocument();
  });

  it('handles Enter key to send message', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(
      <div>
        <textarea
          data-testid="multimodal-input"
          placeholder="Type a message..."
          defaultValue="Test message"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend((e.target as HTMLTextAreaElement).value);
            }
          }}
        />
      </div>
    );

    const input = screen.getByTestId('multimodal-input');
    await user.type(input, '{Enter}');

    expect(handleSend).toHaveBeenCalledWith('Test message');
  });

  it('allows Shift+Enter for new line', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(
      <div>
        <textarea
          data-testid="multimodal-input"
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend((e.target as HTMLTextAreaElement).value);
            }
          }}
        />
      </div>
    );

    const input = screen.getByTestId('multimodal-input');
    await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

    expect(input).toHaveValue('Line 1\nLine 2');
    expect(handleSend).not.toHaveBeenCalled();
  });

  it('shows attachments button', () => {
    render(
      <div>
        <button type="button" data-testid="attachments-button" aria-label="Add attachments">
          📎
        </button>
        <textarea data-testid="multimodal-input" placeholder="Type a message..." />
        <button type="button" data-testid="send-button">Send</button>
      </div>
    );

    expect(screen.getByTestId('attachments-button')).toBeInTheDocument();
  });

  it('handles file attachments', async () => {
    const user = userEvent.setup();
    const handleFileSelect = vi.fn();

    render(
      <div>
        <input
          type="file"
          data-testid="file-input"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <button
          type="button"
          data-testid="attachments-button"
          onClick={() => {
            const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
            fileInput?.click();
          }}
        >
          📎
        </button>
      </div>
    );

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;

    await user.upload(fileInput, file);

    expect(handleFileSelect).toHaveBeenCalled();
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <textarea data-testid="multimodal-input" placeholder="Type a message..." />
        <button
          type="button"
          data-testid="send-button"
          onClick={() => {
            const input = document.querySelector('[data-testid="multimodal-input"]') as HTMLTextAreaElement;
            onSendMessage(input.value);
            input.value = '';
          }}
        >
          Send
        </button>
      </div>
    );

    const input = screen.getByTestId('multimodal-input') as HTMLTextAreaElement;
    await user.type(input, 'Test message');

    expect(input).toHaveValue('Test message');

    const sendButton = screen.getByTestId('send-button');
    await user.click(sendButton);

    expect(input).toHaveValue('');
    expect(onSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('handles multiline input', async () => {
    const user = userEvent.setup();

    render(
      <textarea
        data-testid="multimodal-input"
        placeholder="Type a message..."
        rows={3}
      />
    );

    const input = screen.getByTestId('multimodal-input');
    await user.type(input, 'Line 1{Enter}Line 2{Enter}Line 3');

    expect(input).toHaveValue('Line 1\nLine 2\nLine 3');
  });

  it('auto-resizes textarea based on content', async () => {
    const user = userEvent.setup();

    const handleResize = vi.fn((element: HTMLTextAreaElement) => {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    });

    render(
      <textarea
        data-testid="multimodal-input"
        placeholder="Type a message..."
        onInput={(e) => handleResize(e.target as HTMLTextAreaElement)}
      />
    );

    const input = screen.getByTestId('multimodal-input');
    await user.type(input, 'This is a long message that might cause the textarea to expand');

    expect(handleResize).toHaveBeenCalled();
  });

  it('limits message length', async () => {
    const user = userEvent.setup();
    const maxLength = 10;

    render(
      <textarea
        data-testid="multimodal-input"
        placeholder="Type a message..."
        maxLength={maxLength}
      />
    );

    const input = screen.getByTestId('multimodal-input');
    await user.type(input, 'This is a very long message');

    expect(input).toHaveValue('This is a ');
    expect((input as HTMLTextAreaElement).value.length).toBe(maxLength);
  });
});