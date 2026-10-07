// backend/src/services/redFlagService.js
// Rule-based red-flag SCREENING (not diagnosis). Flags are shown to the doctor for review only.
const RULES = [
  { level: 'high', reason: 'Chest pain / chest tightness reported', re: /chest (pain|tight|pressure|discomfort)|pressure in (the |my )?chest|सीने (में )?(दर्द|जकड़न)|छाती (में )?दर्द/gi },
  { level: 'high', reason: 'Breathlessness / difficulty breathing', re: /breathless|short(ness)? of breath|difficulty (in )?breathing|can'?t breathe|सांस (की )?(तकलीफ|फूल)|साँस (की )?(तकलीफ|फूल)|दम घुट/gi },
  { level: 'high', reason: 'Fainting / loss of consciousness / seizure', re: /faint|passed out|unconscious|seizure|convuls|बेहोश|मिर्गी|दौरा/gi },
  { level: 'high', reason: 'Possible stroke symptoms', re: /slurred|face droop|one[- ]sided weakness|weakness on one side|paralys|लकवा|आधा शरीर/gi },
  { level: 'high', reason: 'Bleeding reported', re: /vomit(ing)? blood|blood in (stool|urine|vomit)|coughing (up )?blood|heavy bleeding|खून की उल्टी|खून आ/gi },
  { level: 'high', reason: 'Self-harm / suicidal thoughts mentioned', re: /suicid|self[- ]harm|end my life|kill myself|आत्महत्या|जान देना/gi },
  { level: 'medium', reason: 'High fever reported', re: /(high|very high) fever|fever (of )?(10[3-9]|39|40)|तेज़? बुखार/gi },
  { level: 'medium', reason: 'Severe or sudden pain reported', re: /severe pain|sudden (severe )?pain|unbearable|असहनीय|तेज़? दर्द/gi },
];
const NEGATION = /\b(no|not|without|denies|never|nahi|नहीं)\W*$/i;

export function detectRedFlags(interview) {
  const texts = [interview.chiefComplaint];
  (interview.responses || []).forEach((r) => {
    texts.push(r.answer);
    (r.extractedData?.symptoms || []).forEach((s) => texts.push(s));
  });
  (interview.clinicalSummary?.symptoms || []).forEach((s) => texts.push(s));

  const flags = [];
  const add = (level, reason) => { if (!flags.some((f) => f.reason === reason)) flags.push({ level, reason, action: 'Clinician review recommended. This is a screening alert, not a diagnosis.' }); };

  for (const text of texts.filter(Boolean).map(String)) {
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text))) {
        const before = text.slice(Math.max(0, m.index - 14), m.index);
        if (!NEGATION.test(before)) { add(rule.level, rule.reason); break; }
      }
    }
  }

  const sev = (interview.responses || []).find((r) => r.questionId === 'q_severity')?.answer || '';
  const num = sev.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (num && Number(num[1]) >= 8) add('medium', `High self-reported severity (${num[1]}/10)`);

  return flags.sort((a, b) => (a.level === b.level ? 0 : a.level === 'high' ? -1 : 1));
}
