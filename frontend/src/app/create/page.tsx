"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const Page = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError("Please enter your username!");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to create room.");
      }

      const { room, participant } = result.data;

      router.push(`/lobby/${room.code}?playerId=${participant.playerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-7 text-center">
          <div className="mb-4 text-5xl">🎨</div>
          <h1 className="font-dyna text-3xl font-bold">Create a Room</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Get your friends together and start drawing!
          </p>
        </div>

        <div className="space-y-4">
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating room..." : "Create Room 🚀"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-foreground/50">
          Invite your friends once your room is ready!
        </p>
      </div>
    </main>
  );
};

export default Page;
