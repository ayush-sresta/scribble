const PlayersPanel = () => {
  const players = [
    { name: "Player 1", score: 120 },
    { name: "Player 2", score: 80 },
    { name: "Player 3", score: 50 },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-dyna text-xl font-bold">🏆 Players</h2>

      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={player.name}
            className="flex items-center justify-between rounded-xl bg-background p-3"
          >
            <span className="font-medium">
              {index + 1}. {player.name}
            </span>

            <span className="font-bold">{player.score}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlayersPanel;
