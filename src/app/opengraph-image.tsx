import { ImageResponse } from "next/og";

export const alt =
  "Planetary Dynamics Explorer — interactive model for exploring Earth's physical evolution";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const questions = [
  "What initiates subduction?",
  "Why does Earth have plates but Venus doesn't?",
  "How did the first continents form?",
  "What drives supercontinent cycles?",
  "Did plate tectonics even exist in the Archean?",
];

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
          padding: "50px 70px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            right: "-100px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(96,165,250,0.10) 0%, rgba(96,165,250,0.03) 40%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top label + title row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              fontSize: "15px",
              color: "#60a5fa",
              letterSpacing: "3px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Interactive Model
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <span
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#e2e8f0",
              lineHeight: 1.1,
            }}
          >
            Planetary Dynamics
          </span>
          <span
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#60a5fa",
              lineHeight: 1.1,
            }}
          >
            Explorer
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "#2a2f4a",
            marginTop: "28px",
            marginBottom: "28px",
            display: "flex",
          }}
        />

        {/* Intro line */}
        <span
          style={{
            fontSize: "20px",
            color: "#94a3b8",
            lineHeight: 1.4,
            marginBottom: "20px",
          }}
        >
          Plate tectonics is powerful. But fundamental questions remain open:
        </span>

        {/* Questions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            flex: 1,
          }}
        >
          {questions.map((q) => (
            <div
              key={q}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#60a5fa",
                  flexShrink: 0,
                  display: "flex",
                }}
              />
              <span
                style={{
                  fontSize: "22px",
                  color: "#e2e8f0",
                  fontWeight: 500,
                }}
              >
                {q}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "20px",
            borderTop: "1px solid #2a2f4a",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              color: "#64748b",
            }}
          >
            What if plate tectonics is one layer of a larger story?
          </span>
          <div style={{ display: "flex", gap: "28px" }}>
            {[
              ["R", "6 371 km"],
              ["g", "9.81 m/s²"],
              ["ρ", "5 515 kg/m³"],
              ["C/MR²", "0.3307"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#60a5fa",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </span>
                <span style={{ fontSize: "14px", color: "#64748b" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
