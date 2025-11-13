"use client";

export default function DifficultySelect({ value, onChange }) {
  return (
    <div style={{ display: "inline-block" }}>
      <label
        style={{ fontSize: "0.9rem", marginRight: "0.4rem", color: "#444" }}
      >
        난이도:
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "0.4rem 0.6rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        <option value="B1">B1 (중하)</option>
        <option value="B2">B2 (중상)</option>
        <option value="C1">C1 (상)</option>
      </select>
    </div>
  );
}
