type ChatBubbleProps = {
  incoming: boolean;
  text: string;
  time: string;
  sender: string;
  index: number;
};

export function ChatBubble({ incoming, text, time, sender, index }: ChatBubbleProps) {
  return (
    <article
      className={`message-row ${incoming ? 'incoming' : 'outgoing'}`}
      style={{ animationDelay: `${Math.min(index * 55, 300)}ms` }}
    >
      <div className="message-stack">
        <span className="message-sender">{sender}</span>
        <div className="message-bubble">
          <p>{text}</p>
          <time>{time}</time>
        </div>
      </div>
    </article>
  );
}
