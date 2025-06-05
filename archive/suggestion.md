🎮 0. High-level Game Loop (reference)

1.  player starts / loads save
2.  scene JSON      ⟶  promptBuilder()
3.  promptBuilder   ⟶  LLM (Gemini / GPT)
4.  LLM returns scene + choices + meta tags
5.  render SceneScreen (text + animations)
6.  player taps choice
7.  updateEmotion() for every NPC touched
8.  store event in memory DB
9.  append to sceneHistory
10. loop to step 2
🧠 1. Emotion Engine ➜ game integration

1 a. Where to call it
import { updateEmotion } from 'logic/ai/emotionEngine';

// inside your Choice handler in SceneScreen
function handleChoice(choice) {
  // ① update emotional state for each NPC involved
  affectedCharacters.forEach(c =>
    updateEmotion(c, choice.emotion_event)   // e.g. "player insults character"
  );

  // ② persist new emotions to DB / localStorage
  saveCharacterEmotions(affectedCharacters);

  // ③ continue the loop
  generateNextScene(choice);
}
Tip: put choice.emotion_event right in the JSON returned by the LLM so each branch knows which trigger to fire ("emotion_event": "player punches character").
1 b. Pass emotions into every prompt
Inside your promptBuilder.ts:

const npcSnapshot = currentNPCs
  .map(c =>
    `${c.name}: anger ${c.emotional_state.anger}, trust ${c.emotional_state.trust}`
  )
  .join('\n');

prompt += `\n\nEMOTIONAL SNAPSHOT:\n${npcSnapshot}`;
🗣 2. Dialogue Generator ➜ game integration

2 a. Build once, re-use everywhere
export function npcReplyPrompt(npc, playerAction, sceneContext) {
  return `
You are ${npc.name}. KEEP THIS STYLE:
- Tone: ${npc.dialogue_style.tone}
- Traits: ${npc.dialogue_style.traits.join(', ')}

Your current emotions: anger ${npc.emotional_state.anger}, trust ${npc.emotional_state.trust}

Player just did: "${playerAction}"

Write ONE reply line. Stay in character.`;
}
Call this in your scene generator when you want a single NPC line, or embed the same data in the bigger scene-creation prompt when you want the LLM to script a whole exchange.

2 b. Example call
const draculaLine = await callLLM(
  npcReplyPrompt(dracula, 'burned the diary', scene)
);
Render it in the bubble / dialogue list.

🎬 3. Scene Meta Tags → Animations

Ask the LLM for a visual block:

"visual": {
  "bg": "storm_castle_night",
  "fx": ["lightning", "torch_flicker"],
  "music": "ominous_drone"
}
3 a. How to request it
Add in your prompt:

AFTER the JSON scene, ALSO return a "visual" key suggesting background id, fx array, and music id.
3 b. In React-Native
const { bg, fx, music } = scene.visual;
setBackground(bg);
fx.forEach(playFx);
playMusic(music);
🛠 Quick “Starter kit” files you can generate in Cursor

File	Purpose
logic/ai/emotionEngine.ts	Emotion math (already sketched)
logic/ai/promptBuilder.ts	Builds master prompt incl. emotions + style
logic/ai/dialogueReply.ts	Generates one-off NPC replies
components/FXLayer.tsx	Draws BG + particle / Lottie FX
data/characters/dracula.json	Full persona + triggers + style
Use ⌘K › “Create File” in Cursor and paste the snippets.

🧪 Test Scenario (use Cursor chat)

“Cursor, simulate a scene where the player punches Renfield.
Show how updateEmotion pushes anger to 95 and triggers a fight back reaction rule, then build the prompt for Dracula’s next entrance.”
Cursor will draft the code + prompt + expected LLM output so you can iterate fast.

Need the actual code files pre-written?
Reply with which ones (e.g., emotionEngine.ts and FXLayer.tsx) and I’ll drop ready-to-paste code.