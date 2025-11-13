// app/page.jsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 600 }}>English Essay MVP</h1>

      <ul style={{ marginTop: "1.5rem", lineHeight: "2" }}>
        <li>
          <Link href="/writing">✍️ Writing</Link>
        </li>
        <li>
          <Link href="/listing">📄 Listing</Link>
        </li>
        <li>
          <Link href="/studying">📚 Studying</Link>
        </li>
      </ul>
    </main>
  );
}
