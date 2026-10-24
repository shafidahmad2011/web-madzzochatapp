type ChatBubbleProps = {
  incoming: boolean;
  text?: string;
  image?: string;
  time: string;
};

export function ChatBubble({ incoming, text, image, time }: ChatBubbleProps) {
  return (
    <div className={`message-row ${incoming ? 'incoming' : 'outgoing'}`}>
      <div className={`message-bubble ${image ? 'media' : ''}`}>
        {image ? <img src={image} alt="media content" className="message-image" /> : <p>{text}</p>}
        <time>{time}</time>
      </div>
    </div>
  );
}
