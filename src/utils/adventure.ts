// Aturan cerita Game Adventure Studi Kasus: bentuk scene, pemeriksa alur, dan versi scene untuk pemain.

export type SceneType = "STORY" | "CHALLENGE" | "ENDING";
export type AdventureChoice = { text: string; next: string };

export type AdventureScene = {
  sceneKey: string;
  sceneType: SceneType;
  isStart: boolean;
  title: string;
  content: string;
  choices: AdventureChoice[];
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D" | null;
  explanation: string;
  nextCorrect: string;
  nextWrong: string;
  endingScore: number | null;
  verse: string;
  reflection: string;
};

const SCENE_TYPES: SceneType[] = ["STORY", "CHALLENGE", "ENDING"];
const SCENE_KEY_PATTERN = /^[A-Za-z0-9_-]{1,20}$/;
export const MIN_CHOICES = 2;
export const MAX_CHOICES = 4;

const str = (value: unknown, max = 5000) => String(value ?? "").slice(0, max);

// Bentuk data dari editor/ database dirapikan ke satu bentuk yang sama
export function toAdventureScene(raw: any): AdventureScene {
  let choices: unknown = raw?.choices;
  if (typeof choices === "string") {
    try { choices = JSON.parse(choices); } catch { choices = []; }
  }
  const score = raw?.endingScore === "" || raw?.endingScore === null || raw?.endingScore === undefined ? null : Number(raw.endingScore);
  const answer = String(raw?.correctAnswer ?? "").toUpperCase();
  return {
    sceneKey: str(raw?.sceneKey, 20).trim(),
    sceneType: SCENE_TYPES.includes(raw?.sceneType) ? raw.sceneType : "STORY",
    isStart: !!raw?.isStart,
    title: str(raw?.title, 255),
    content: str(raw?.content),
    choices: (Array.isArray(choices) ? choices : []).slice(0, MAX_CHOICES).map((c: any) => ({ text: str(c?.text, 255), next: str(c?.next, 20) })),
    question: str(raw?.question),
    optionA: str(raw?.optionA, 255),
    optionB: str(raw?.optionB, 255),
    optionC: str(raw?.optionC, 255),
    optionD: str(raw?.optionD, 255),
    correctAnswer: ["A", "B", "C", "D"].includes(answer) ? (answer as AdventureScene["correctAnswer"]) : null,
    explanation: str(raw?.explanation),
    nextCorrect: str(raw?.nextCorrect, 20),
    nextWrong: str(raw?.nextWrong, 20),
    endingScore: Number.isFinite(score) ? Math.round(score as number) : null,
    verse: str(raw?.verse),
    reflection: str(raw?.reflection),
  };
}

// Scene berikutnya yang bisa dituju dari satu scene
export function nextKeys(scene: AdventureScene): string[] {
  if (scene.sceneType === "STORY") return scene.choices.map(c => c.next);
  if (scene.sceneType === "CHALLENGE") return [scene.nextCorrect, scene.nextWrong];
  return [];
}

// Pemeriksa alur: mengembalikan daftar masalah (kosong = cerita siap dikirim)
export function validateAdventure(scenes: AdventureScene[], passPercentage: number): string[] {
  const errors: string[] = [];
  if (scenes.length === 0) return ["Belum ada scene."];

  const byKey = new Map<string, AdventureScene>();
  for (const scene of scenes) {
    if (!SCENE_KEY_PATTERN.test(scene.sceneKey)) errors.push(`Kode scene "${scene.sceneKey}" tidak valid.`);
    else if (byKey.has(scene.sceneKey)) errors.push(`Kode scene ${scene.sceneKey} dipakai lebih dari sekali.`);
    byKey.set(scene.sceneKey, scene);
  }

  const starts = scenes.filter(s => s.isStart);
  if (starts.length !== 1) errors.push("Tandai tepat satu scene sebagai scene awal.");
  if (starts[0]?.sceneType === "ENDING") errors.push("Scene awal tidak boleh berupa Akhir.");

  for (const scene of scenes) {
    const name = `Scene ${scene.sceneKey}${scene.title.trim() ? ` (${scene.title.trim()})` : ""}`;
    if (!scene.title.trim()) errors.push(`${name}: judul belum diisi.`);
    if (!scene.content.trim()) errors.push(`${name}: isi cerita belum diisi.`);
    const checkTarget = (target: string, label: string) => {
      if (!target) errors.push(`${name}: ${label} belum menuju scene mana pun.`);
      else if (!byKey.has(target)) errors.push(`${name}: ${label} menuju scene ${target} yang tidak ada.`);
      else if (target === scene.sceneKey) errors.push(`${name}: ${label} tidak boleh menuju scene itu sendiri.`);
    };

    if (scene.sceneType === "STORY") {
      if (scene.choices.length < MIN_CHOICES || scene.choices.length > MAX_CHOICES) errors.push(`${name}: scene Cerita harus punya ${MIN_CHOICES}–${MAX_CHOICES} pilihan.`);
      scene.choices.forEach((choice, i) => {
        if (!choice.text.trim()) errors.push(`${name}: teks pilihan ${i + 1} belum diisi.`);
        checkTarget(choice.next, `pilihan ${i + 1}`);
      });
    } else if (scene.sceneType === "CHALLENGE") {
      if (!scene.question.trim()) errors.push(`${name}: soal tantangan belum diisi.`);
      if (![scene.optionA, scene.optionB, scene.optionC, scene.optionD].every(o => o.trim())) errors.push(`${name}: opsi A–D belum lengkap.`);
      if (!scene.correctAnswer) errors.push(`${name}: kunci jawaban belum dipilih.`);
      checkTarget(scene.nextCorrect, "jawaban benar");
      checkTarget(scene.nextWrong, "jawaban salah");
    } else {
      if (scene.endingScore === null || scene.endingScore < 0 || scene.endingScore > 100) errors.push(`${name}: nilai ending harus 0–100.`);
      if (!scene.verse.trim()) errors.push(`${name}: ayat belum diisi.`);
      if (!scene.reflection.trim()) errors.push(`${name}: ajakan refleksi belum diisi.`);
    }
  }

  const endings = scenes.filter(s => s.sceneType === "ENDING");
  if (endings.length === 0) errors.push("Minimal harus ada satu scene Akhir.");
  else if (!endings.some(s => (s.endingScore ?? -1) >= passPercentage)) {
    errors.push(`Belum ada ending dengan nilai ≥ ${passPercentage} (nilai minimal lulus), jadi pemain tidak akan pernah lulus.`);
  }
  const start = starts[0];
  if (errors.length > 0 || !start) return errors;

  // Semua scene harus bisa dicapai dari scene awal
  const reachable = new Set<string>([start.sceneKey]);
  const queue = [start.sceneKey];
  while (queue.length) {
    const scene = byKey.get(queue.shift()!)!;
    for (const key of nextKeys(scene)) if (!reachable.has(key)) { reachable.add(key); queue.push(key); }
  }
  for (const scene of scenes) {
    if (!reachable.has(scene.sceneKey)) errors.push(`Scene ${scene.sceneKey} (${scene.title}) tidak bisa dicapai dari scene awal.`);
  }

  // Tidak boleh ada jalan buntu: dari setiap scene harus ada jalan menuju salah satu Akhir
  const canFinish = new Set(endings.map(s => s.sceneKey));
  let changed = true;
  while (changed) {
    changed = false;
    for (const scene of scenes) {
      if (!canFinish.has(scene.sceneKey) && nextKeys(scene).some(k => canFinish.has(k))) { canFinish.add(scene.sceneKey); changed = true; }
    }
  }
  for (const scene of scenes) {
    if (!canFinish.has(scene.sceneKey)) errors.push(`Scene ${scene.sceneKey} (${scene.title}) berputar terus dan tidak pernah sampai ke Akhir.`);
  }
  return errors;
}

// Scene untuk pemain: tanpa kunci jawaban dan tanpa tujuan pilihan (alur cerita ditentukan server)
export function publicAdventureScene(scene: AdventureScene) {
  const base = { sceneKey: scene.sceneKey, sceneType: scene.sceneType, title: scene.title, content: scene.content };
  if (scene.sceneType === "STORY") return { ...base, choices: scene.choices.map(c => c.text) };
  if (scene.sceneType === "CHALLENGE") return { ...base, question: scene.question, optionA: scene.optionA, optionB: scene.optionB, optionC: scene.optionC, optionD: scene.optionD };
  return { ...base, endingScore: scene.endingScore, verse: scene.verse, reflection: scene.reflection };
}
