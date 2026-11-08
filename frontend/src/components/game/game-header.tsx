type Props = {
  code: string;
};

const GameHeader = ({ code }: Props) => {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <h1 className="font-dyna text-2xl font-bold">🎨 Scribble</h1>

      <div className="flex gap-5 text-sm font-semibold">
        <span>Round 1/3</span>
        <span>⏱️ 80s</span>
        <span>Room: {code}</span>
      </div>
    </header>
  );
};

export default GameHeader;
