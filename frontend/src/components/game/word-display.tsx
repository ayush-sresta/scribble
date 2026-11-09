"use client";

interface WordDisplayProps {
  word: string | null;
  hint: string | null;
  isArtist: boolean;
}

export default function WordDisplay({
  word,
  hint,
  isArtist,
}: WordDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">
        {isArtist ? "Your word is..." : "Guess the word!"}
      </p>

      <h2 className="text-2xl font-bold tracking-widest">
        {isArtist ? (word ?? "Waiting...") : (hint ?? "Waiting...")}
      </h2>
    </div>
  );
}
