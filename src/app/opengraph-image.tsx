import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Canvas multi-agent LaTeX editor";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at 12% 20%, #dce9df 0%, #edf1ee 45%, #f7f8f7 100%)",
          color: "#111827",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              border: "1px solid #cfd8d1",
              borderRadius: 9999,
              background: "#ffffff",
              padding: "10px 18px",
              fontSize: 24,
              fontWeight: 700,
              color: "#1f4d2f",
            }}
          >
            Canvas
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#4b5563",
            }}
          >
            Gemini 2.5 + 3.0
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>
            Multi-Agent LaTeX Editor
          </div>
          <div style={{ fontSize: 30, color: "#4b5563", maxWidth: 1040 }}>
            Draft, review, format, and research in one AI-powered writing workspace.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 22,
            color: "#1f2937",
          }}
        >
          <div style={{ background: "#ffffff", border: "1px solid #d5ddd7", borderRadius: 9999, padding: "8px 14px" }}>
            Writer
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #d5ddd7", borderRadius: 9999, padding: "8px 14px" }}>
            Reviewer
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #d5ddd7", borderRadius: 9999, padding: "8px 14px" }}>
            Formatter
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #d5ddd7", borderRadius: 9999, padding: "8px 14px" }}>
            Research
          </div>
        </div>
      </div>
    ),
    size
  );
}
