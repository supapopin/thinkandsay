import Link from "next/link";

export default function EssayCard({ essay }) {
  return (
    <Link
      href={`/studying?essayId=${essay.id}`}
      className="block border rounded p-4 hover:bg-gray-50 transition"
    >
      <div className="font-semibold">{essay.topic}</div>
      <div className="text-sm text-gray-500 mt-1">
        난이도: {essay.difficulty || "N/A"}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {new Date(essay.created_at).toLocaleString()}
      </div>
    </Link>
  );
}
