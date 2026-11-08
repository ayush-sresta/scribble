const ChatPanel = () => {
  return (
    <section className="flex min-h-[350px] flex-col rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-dyna text-xl font-bold">💬 Chat</h2>

      <div className="flex-1 text-sm text-foreground/50">
        <p>Welcome to Scribble!</p>
        <p className="mt-2">Start guessing...</p>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Type your guess..."
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
        />

        <button className="rounded-xl bg-primary px-4 font-bold text-white">
          Send
        </button>
      </div>
    </section>
  );
};

export default ChatPanel;
