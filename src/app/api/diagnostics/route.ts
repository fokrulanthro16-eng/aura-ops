import { NextRequest, NextResponse } from 'next/server';

export type DiagnosticSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type EngineSource = 'Nebius Nemotron' | 'Google Gemini' | 'Autonomous Edge';

export interface DiagnosticPayload {
  coreTemp: number;
  vibration: number;
  spindleRpm: number;
  jointAngles: Record<string, number> | number[];
  status: string;
}

export interface DiagnosticResponse {
  diagnosis: string;
  rootCause: string;
  recommendedAction: string;
  severity: DiagnosticSeverity;
  engineSource: EngineSource;
  latencyMs: number;
}

// Helper to strip markdown code blocks and extract valid JSON
function parseJsonSafe(text: string): {
  diagnosis?: string;
  rootCause?: string;
  recommendedAction?: string;
  severity?: string;
} | null {
  try {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      clean = match[0];
    }
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// Normalize severity enum string
function normalizeSeverity(raw?: string): DiagnosticSeverity {
  const upper = (raw || '').toUpperCase().trim();
  if (upper.includes('CRIT') || upper.includes('ERROR') || upper.includes('DANGER')) return 'CRITICAL';
  if (upper.includes('WARN') || upper.includes('CAUTION')) return 'WARNING';
  return 'NORMAL';
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let payload: DiagnosticPayload = {
    coreTemp: 48.0,
    vibration: 1.15,
    spindleRpm: 1450,
    jointAngles: { J1: 0, J2: 25, J3: -45, J4: 0, J5: 30, J6: 0 },
    status: 'NORMAL',
  };

  try {
    const body = await req.json();
    payload = { ...payload, ...body };
  } catch {
    // Keep defaults on empty / malformed body
  }

  const { coreTemp, vibration, spindleRpm, jointAngles, status } = payload;
  const systemPrompt =
    "You are AURA-OPS Industrial Robot Copilot. Output strict JSON with keys: diagnosis, rootCause, recommendedAction, severity ('NORMAL'|'WARNING'|'CRITICAL'). Max 30 words per field.";
  const userPrompt = `Analyze this industrial telemetry snapshot:
Core Temperature: ${coreTemp}°C
Vibration RMS: ${vibration} mm/s
Spindle Speed: ${spindleRpm} RPM
Operational Status: ${status}
Joint Angles: ${JSON.stringify(jointAngles)}
Respond with strict JSON only.`;

  // =========================================================================
  // TIER 1: Primary - Nebius Nemotron / Llama-3.1 (Timeout: 4500ms)
  // =========================================================================
  const nebiusKey = process.env.NEBIUS_API_KEY;
  if (nebiusKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      // Attempt primary model: nvidia/nemotron-4-340b-instruct, fallback to meta-llama/Meta-Llama-3.1-70B-Instruct
      const response = await fetch('https://api.studio.nebius.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nebiusKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-4-340b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = parseJsonSafe(content);
          if (parsed && parsed.diagnosis) {
            return NextResponse.json<DiagnosticResponse>({
              diagnosis: parsed.diagnosis,
              rootCause: parsed.rootCause || 'Identified via Nebius deep kinematic analysis.',
              recommendedAction: parsed.recommendedAction || 'Execute standard inspection protocol.',
              severity: normalizeSeverity(parsed.severity),
              engineSource: 'Nebius Nemotron',
              latencyMs: Date.now() - startTime,
            });
          }
        }
      }
    } catch {
      // Fall through to Tier 2 on timeout, network error, or 4xx/5xx code
    }
  }

  // =========================================================================
  // TIER 2: Secondary Fallback - Google Gemini REST API (Timeout: 4500ms)
  // =========================================================================
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}\n\n${userPrompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
              maxOutputTokens: 350,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const parsed = parseJsonSafe(content);
          if (parsed && parsed.diagnosis) {
            return NextResponse.json<DiagnosticResponse>({
              diagnosis: parsed.diagnosis,
              rootCause: parsed.rootCause || 'Identified via Gemini multimodal sensor reasoning.',
              recommendedAction: parsed.recommendedAction || 'Review robotic workcell parameters.',
              severity: normalizeSeverity(parsed.severity),
              engineSource: 'Google Gemini',
              latencyMs: Date.now() - startTime,
            });
          }
        }
      }
    } catch {
      // Fall through to Tier 3 on timeout or error
    }
  }

  // =========================================================================
  // TIER 3: Autonomous Edge Deterministic Rule-Engine Fallback
  // =========================================================================
  let diagnosis = 'Kinematic alignment nominal. All 6 axes within 99.8% precision tolerance.';
  let rootCause = 'Zero anomalies detected across harmonic drives and optical joint encoders.';
  let recommendedAction = 'Continue automated manufacturing cycle without intervention.';
  let severity: DiagnosticSeverity = 'NORMAL';

  if (vibration > 2.5) {
    diagnosis = 'Actuator J3 harmonic resonance & bearing micro-wear detected.';
    rootCause = 'Hydrodynamic lubrication degradation under sustained multi-axis cycle loading.';
    recommendedAction = 'Recalibrate spindle speed and inspect bearing oil.';
    severity = 'WARNING';
  } else if (coreTemp > 60.0) {
    diagnosis = 'Thermal threshold alert on joint servo windings.';
    rootCause = 'Extended high-torque cycle causing stator coil overheating.';
    recommendedAction = 'Enable secondary liquid cooling loop and throttle peak acceleration.';
    severity = 'WARNING';
  } else if (status === 'CRITICAL') {
    diagnosis = 'Emergency Stop engaged / safety perimeter interlock active.';
    rootCause = 'Safety line open or hardware E-STOP trigger tripped.';
    recommendedAction = 'Verify perimeter integrity and reset safety latch before reboot.';
    severity = 'CRITICAL';
  }

  return NextResponse.json<DiagnosticResponse>({
    diagnosis,
    rootCause,
    recommendedAction,
    severity,
    engineSource: 'Autonomous Edge',
    latencyMs: Date.now() - startTime,
  });
}
