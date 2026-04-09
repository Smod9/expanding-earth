import { ImageResponse } from "next/og";

export const alt =
  "Planetary Dynamics Explorer — interactive model for exploring Earth's physical evolution";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0c0f1a",
          padding: "60px 70px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow behind the globe */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-120px",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(96,165,250,0.12) 0%, rgba(96,165,250,0.04) 40%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Decorative orbit rings */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "40px",
            width: "440px",
            height: "440px",
            borderRadius: "50%",
            border: "1px solid rgba(96,165,250,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "120px",
            right: "100px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            border: "1px solid rgba(96,165,250,0.12)",
            display: "flex",
          }}
        />

        {/* Globe icon */}
        <div
          style={{
            position: "absolute",
            top: "180px",
            right: "160px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, #1e3a5f, #0c0f1a)",
            border: "2px solid rgba(96,165,250,0.25)",
            boxShadow: "0 0 60px rgba(96,165,250,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: "80px",
              display: "flex",
            }}
          >
            🌍
          </div>
        </div>

        {/* Top label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "4px",
              borderRadius: "2px",
              background: "#60a5fa",
              display: "flex",
            }}
          />
          <span
            style={{
              fontSize: "16px",
              color: "#60a5fa",
              letterSpacing: "3px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Interactive Model
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            maxWidth: "650px",
          }}
        >
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#e2e8f0",
              lineHeight: 1.1,
            }}
          >
            Planetary
          </span>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#e2e8f0",
              lineHeight: 1.1,
            }}
          >
            Dynamics
          </span>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#60a5fa",
              lineHeight: 1.1,
            }}
          >
            Explorer
          </span>
        </div>

        {/* Subtitle */}
        <span
          style={{
            fontSize: "20px",
            color: "#64748b",
            marginTop: "24px",
            maxWidth: "520px",
            lineHeight: 1.5,
          }}
        >
          Explore how radius, density, gravity, and rotation evolve across 4.5
          billion years of planetary history.
        </span>

        {/* Bottom bar with data points */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "auto",
            paddingTop: "24px",
            borderTop: "1px solid #2a2f4a",
          }}
        >
          {[
            ["R", "6 371 km"],
            ["g", "9.81 m/s²"],
            ["ρ", "5 515 kg/m³"],
            ["C/MR²", "0.3307"],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "baseline", gap: "8px" }}
            >
              <span style={{ fontSize: "16px", color: "#60a5fa", fontWeight: 600 }}>
                {label}
              </span>
              <span style={{ fontSize: "16px", color: "#64748b" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
