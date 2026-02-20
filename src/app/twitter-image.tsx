import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Canvas LaTeX editor with AI agents";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "46px 52px",
          background: "linear-gradient(130deg, #edf2ee 0%, #f8faf8 55%, #e5ece7 100%)",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          color: "#111827",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: "68%" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#1f4d2f" }}>Canvas</div>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.03 }}>
            Build Better Papers Faster
          </div>
          <div style={{ fontSize: 30, color: "#4b5563", lineHeight: 1.2 }}>
            AI writer, reviewer, formatter, and research agents for LaTeX workflows.
          </div>
        </div>

        <div
          style={{
            width: 340,
            borderRadius: 20,
            border: "1px solid #d5ddd7",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            padding: 20,
            gap: 12,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}>New Draft</div>
          <div style={{ borderRadius: 12, border: "1px solid #dce3dd", background: "#f8faf8", padding: "10px 12px", fontSize: 16, color: "#6b7280" }}>
            Describe your paper goal...
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ borderRadius: 9999, border: "1px solid #d5ddd7", padding: "6px 10px", fontSize: 14 }}>
              Gemini 3
            </div>
            <div style={{ borderRadius: 9999, border: "1px solid #d5ddd7", padding: "6px 10px", fontSize: 14 }}>
              Web Research
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
