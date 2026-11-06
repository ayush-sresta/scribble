"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const Page = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim() || !code.trim()) {
      setError("Please enter your username and room code.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        "http://localhost:5000/api/rooms/join",
        {
          username: username.trim(),
          code: code.trim().toUpperCase(),
        },
      );

      const { room, participant } = response.data.data;

      router.push(`/lobby/${room.code}?playerId=${participant.playerId}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to join room.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-7 text-center">
          <div className="mb-4 text-5xl">🖌️</div>

          <h1 className="font-dyna text-3xl font-bold">Join a Room</h1>

          <p className="mt-2 text-sm text-foreground/60">
            Enter your details and join the drawing party!
          </p>
        </div>

        <form onSubmit={handleJoinRoom} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Your nickname
            </label>

            <input
              type="text"
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Room code
            </label>

            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder="e.g. GQJA5F"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-xl font-bold uppercase tracking-[0.3em] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Joining room..." : "Join Room 🚀"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-foreground/50">
          Don't have a room code? Ask your friend to invite you!
        </p>
      </div>
    </main>
  );
};

export default Page;
