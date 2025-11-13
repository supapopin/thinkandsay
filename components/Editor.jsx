"use client";

export default function Editor({
  label = "Essay",
  value,
  onChange,
  placeholder = "여기에 에세이를 작성해 보세요.",
  rows = 12,
}) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      {label && (
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 500,
            marginBottom: "0.4rem",
          }}
        >
          {label}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "0.95rem",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
