const $ = (id) => document.getElementById(id);

// Text fields we store as strings
const FIELDS = ["teacher", "date", "group", "duration", "title", "brief", "constraints", "slidesNotes"];
const STORAGE_KEY = "lessonPlanPromptBuilder.streamlined.v2";

function toggleSlidesNotes(show) {
  const wrap = $("slidesNotesWrap");
  if (wrap) wrap.style.display = show ? "block" : "none";
}

function getValues() {
  const v = {};
  for (const k of FIELDS) v[k] = ($(k)?.value ?? "").trim();
  v.useSlides = $("useSlides")?.checked ?? false;
  return v;
}

function setValues(v) {
  for (const k of FIELDS) if ($(k)) $(k).value = v?.[k] ?? "";
  if ($("useSlides")) $("useSlides").checked = !!v?.useSlides;
  toggleSlidesNotes(!!v?.useSlides);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getValues()));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) setValues(JSON.parse(raw));
  else toggleSlidesNotes(false);
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  setValues({});
  $("promptOutput").value = "";
  toggleSlidesNotes(false);
}

function generatePrompt() {
  const v = getValues();

  const slidesBlock = v.useSlides
    ? `
SLIDES/POWERPOINT (IMPORTANT):
- I intend to upload/attach a PowerPoint (or PDF export) in this same ChatGPT chat.
- FIRST: confirm whether you can access any attached slides/resources in this chat.
  - If you cannot see any attachments, STOP and respond only: "Please upload/attach the PowerPoint (or PDF export) and I will generate the full lesson plan from it."
  - Do not generate the lesson plan until the slides are attached.
- If slides ARE attached, use them as the PRIMARY source of truth for specificity (tasks, questions, vocabulary, misconceptions, and checks for understanding).
- First: quickly summarise the slide flow in 5–8 bullets (max).
- Then: produce the fully filled lesson plan aligned to the slide flow.
- When you use slide details, reference them like (Slide 3) or (Slides 6–8).
- If my brief conflicts with slides, prefer the slides and clearly flag the conflict.
Optional notes about the slides/resources:
${v.slidesNotes || "None provided."}
`.trim()
    : `
SLIDES/POWERPOINT:
- No slides are attached (or I am not providing them).
- Still produce a fully filled plan using the brief description below.
- Make only cautious, reasonable assumptions and label them [ASSUMED]. Use [ADD HERE] if you cannot safely assume.
`.trim();

  const prompt = `
You are helping me complete the "NIoT ITE lesson plan proforma".
Using the information below, draft a COMPLETE, fully filled lesson plan in the SAME section structure and headings as the proforma:

- Part I – Lesson overview/thinking
- Part II - Lesson Sequence (table with Lesson time / Teacher / Learners)
- Part III – Lesson Evaluation

IMPORTANT RULES:
- Produce a complete plan even if some information is missing.
- Use my title + brief description to infer sensible objectives, retrieval, sequence, checks for understanding, misconceptions, and vocabulary.
- Do NOT invent very specific resources/questions unless they are explicitly shown in the slides. If you assume, label [ASSUMED].
- Include explicit checkpoints/assessment moments aligned to objectives.
- Keep it classroom-ready: routines, modelling, questioning, guided → independent practice, exit ticket.
- Include adaptations/notes for SEND/EAL/high attainers where appropriate.
- Timings must add up to the lesson duration (if duration is missing, assume 50 mins and label [ASSUMED]).

${slidesBlock}

MY INPUTS:
Teacher: ${v.teacher || "[ADD HERE]"}
Date: ${v.date || "[ADD HERE]"}
Teaching group: ${v.group || "[ADD HERE]"}
Duration: ${v.duration || "[ASSUMED: 50 mins]"}
Lesson title/topic: ${v.title || "[ADD HERE]"}

Brief lesson description (main source if slides are not attached):
${v.brief || "[ADD HERE]"}

Context / constraints (must follow):
${v.constraints || "None provided."}

OUTPUT REQUIREMENTS:
1) Part I – Lesson overview/thinking
Include:
- Lesson objective(s) (2–4, measurable)
- Review (prior learning to revisit)
- Starting point vs end point
- Core knowledge + how assessed
- Core knowledge checkpoints (what you do + what students do)
- Likely misconceptions + how you’ll diagnose/respond
- Tier 2/3 vocabulary + how taught

2) Part II - Lesson Sequence
- A realistic lesson sequence table for the full duration (timings add up).
- Include entry routine + retrieval, modelling/input, guided practice, independent practice.
- Include at least 2 checkpoints + a plenary/exit ticket.
- Make teacher and learner actions specific.
- If slides are attached, align the sequence to the slide flow and reference slide numbers.

3) Part III – Lesson Evaluation
- A post-lesson evaluation template (bullet prompts)
- Plus suggested likely reflections based on the plan, marked [ASSUMED] (unless explicitly evidenced by slides).

Now write the lesson plan in that structure with clear headings and a clear table for Part II.
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

  // autosave for text inputs
  for (const k of FIELDS) {
    const el = $(k);
    if (!el) continue;
    el.addEventListener("input", save);
    el.addEventListener("change", save);
  }

  // checkbox behaviour
  const cb = $("useSlides");
  if (cb) {
    cb.addEventListener("change", () => {
      toggleSlidesNotes(cb.checked);
      save();
    });
  }

  $("generateBtn").addEventListener("click", generatePrompt);
  $("copyBtn").addEventListener("click", copyPrompt);
  $("resetBtn").addEventListener("click", resetAll);
});