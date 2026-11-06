import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex justify-between items-center">
        <h1 className="font-dyna text-4xl font-bold">Scribble</h1>
        <div className="flex items-center gap-10">
          <p>How to play</p>
          <p>Leaderboard</p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button className="bg-primary text-background px-4 py-2.5 rounded-full font-semibold cursor-pointer">
            Play now
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 mt-60">
        <h2 className="font-roboto-slab text-7xl font-medium">Draw it.</h2>
        <h2 className="font-roboto-slab text-7xl font-medium">
          Guess it. Laugh Loud.
        </h2>
        <p className="text-gray-600 mt-3 flex items-center flex-col text-lg">
          <span>
            A free online draw-and-guess party game. Create a room, send the
          </span>
          <span>
            link to your friends. and in 30 seconds you will be roasting each
          </span>
          <span>other's drawing skills.</span>
        </p>
        <div className="flex items-center gap-5">
          <Link href={"/create"}>
            <button className="bg-primary py-3 px-5 text-background font-semibold rounded-full cursor-pointer">
              Create room
            </button>
          </Link>
          <Link href={"/join"}>
            <button className="border-2 border-primary py-3 px-5 font-semibold rounded-full cursor-pointer">
              Join room
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
