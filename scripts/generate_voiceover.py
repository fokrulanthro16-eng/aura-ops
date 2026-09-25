import asyncio
import os
import edge_tts

VOICEOVER_TEXT = """
Unplanned industrial downtime costs manufacturers over fifty billion dollars every single year. Most factory floors are still tethered to flat two-dimensional monitors, while legacy VR tools force teams into heavy, multi-gigabyte client installs.

We built AURA-OPS to break that paradigm. It is an enterprise-grade, six-axis industrial digital twin and autonomous copilot, streaming instantly inside Meta Quest Browser—with zero installation.

Every joint is kinematic, accurate down to the sub-millimeter. Using Meta Quest six-degree-of-freedom hand tracking, operators don’t click floating flat menus. Instead, they reach out, pinch, and interact directly with a tactile three-dimensional stanchion console.

When thermal or harmonic stresses build up, the platform does not panic—it reasons. A holographic laser sweeps the cell, while our resilient three-tier AI cascade diagnoses root-cause mechanical failure in under five hundred milliseconds. We combine deep reasoning from Nebius Nemotron, sub-second validation from Gemini, and an air-gapped deterministic ISO vibration engine that never goes down, even without internet.

With one gesture, engineers can radially explode the assembly to inspect harmonic drives, and automatically dispatch a structured SAP maintenance work order—complete with genuine OEM part SKUs and assigned crews.

AURA-OPS is open-source, locked at ninety hertz on standalone hardware, and ready for the future of spatial operations.
""".strip()

async def main():
    showcase_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'showcase'))
    os.makedirs(showcase_dir, exist_ok=True)
    output_mp3 = os.path.join(showcase_dir, 'aura_ops_executive_voiceover.mp3')

    # Selected high-clarity executive voice: en-US-ChristopherNeural
    # Pacing: --rate=-4% for authoritative weight, --pitch=+0Hz
    voice = "en-US-ChristopherNeural"
    rate = "-4%"
    pitch = "+0Hz"

    print(f"Generating neural executive voiceover using {voice}...")
    communicate = edge_tts.Communicate(VOICEOVER_TEXT, voice=voice, rate=rate, pitch=pitch)
    await communicate.save(output_mp3)

    if os.path.exists(output_mp3) and os.path.getsize(output_mp3) > 1000:
        print(f"[OK] Executive voiceover generated successfully: {output_mp3} ({os.path.getsize(output_mp3)} bytes)")
    else:
        raise RuntimeError("Voiceover generation failed or output file is empty")

if __name__ == "__main__":
    asyncio.run(main())
