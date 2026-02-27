const $ = (id) => document.getElementById(id);

const FIELDS = ["teacher", "date", "group", "duration", "title", "brief", "constraints"];
const STORAGE_KEY = "lessonPlanPromptBuilder.streamlined.v1";

function getValues() {
  const v = {};
  for (const k of FIELDS) v[k] = ($(k)?.value ?? "").trim();
  return v;
}

function setValues(v) {
  for (const k of FIELDS) if ($(k)) $(k).value = v?.[k] ?? "";
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getValues()));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) setValues(JSON.parse(raw));
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  setValues({});
  $("promptOutput").value = "";
}

function generatePrompt() {
  const v = getValues();

  const prompt = `
You are helping me complete the "NIoT ITE lesson plan proforma".
Using ONLY the information below, draft a complete lesson plan in the SAME section structure and headings as the proforma:

- Part I – Lesson overview/thinking
- Part II - Lesson Sequence (table with Lesson time / Teacher / Learners)
- Part III – Lesson Evaluation

IMPORTANT RULES:
- Use my title + brief description to infer sensible objectives, retrieval, sequence, checks for understanding, misconceptions, and vocabulary.
- If any details are not provided, either:
  (A) make a reasonable teacher-like assumption BUT clearly mark it as [ASSUMED], OR
  (B) write [ADD HERE] if you cannot safely assume.
- Include explicit checkpoints/assessment moments aligned to objectives.
- Keep it classroom-ready: routines, modelling, questioning, guided → independent practice, exit ticket.
- Include adaptations/notes for SEND/EAL/high attainers where appropriate (use assumptions sparingly and mark them).

MY INPUTS:
Teacher: ${v.teacher || "[ADD HERE]"}
Date: ${v.date || "[ADD HERE]"}
Teaching group: ${v.group || "[ADD HERE]"}
Duration: ${v.duration || "[ADD HERE]"}
Lesson title/topic: ${v.title || "[ADD HERE]"}

Brief lesson description (this is the main source of truth):
${v.brief || "[ADD HERE]"}

Context / constraints (must follow):
${v.constraints || "None provided."}

OUTPUT REQUIREMENTS:
1) Produce Part I with:
- Lesson objective(s) (2–4, measurable)
- Review (prior learning to revisit)
- Starting point vs end point
- Core knowledge + how assessed
- Core knowledge checkpoints (what you do + what students do)
- Likely misconceptions + how you’ll diagnose/respond
- Tier 2/3 vocabulary + how taught

2) Produce Part II:
- A realistic lesson sequence table for the full duration (use timings that add up).
- Include at least 2 checkpoints + a plenary/exit ticket.
- Make teacher and learner actions specific.

3) Produce Part III:
- A post-lesson evaluation template (bullet prompts) + suggested likely reflections based on the plan, marked [ASSUMED].

Now write the lesson plan in that structure.
`.trim();

  $("promptOutput").value = prompt;
  save();
}

async function copyPrompt() {
  const text = $("promptOutput").value.trim();
  if (!text) return;

  await navigator.clipboard.writeText(text);
  $("copyBtn").textContent = "Copied!";
  setTimeout(() => ($("copyBtn").textContent = "Copy prompt"), 900);
}

// wire up
window.addEventListener("DOMContentLoaded", () => {
  load();

  for (const k of FIELDS) {
    const el = $(k);
    if (!el) continue;
    el.addEventListener("input", save);
    el.addEventListener("change", save);
  }

  $("generateBtn").addEventListener("click", generatePrompt);
  $("copyBtn").addEventListener("click", copyPrompt);
  $("resetBtn").addEventListener("click", resetAll);
});