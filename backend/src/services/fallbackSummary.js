// backend/src/services/fallbackSummary.js
// Used only when the AI is unavailable (no key / network / quota). Built purely from the patient's own answers.
export function buildFallbackSummary(interview) {
  const s = {
    chiefComplaint: interview.chiefComplaint || 'Not provided',
    duration: '', severity: '', symptoms: [], medicalHistory: [], medications: [],
    allergies: [], previousAdmissions: [], relevantResponses: [], aiSummaryText: '', generatedAt: new Date(),
  };
  const yes = (a) => /^(yes|हाँ|हां)/i.test((a || '').trim());
  const no = (a) => /^(no|नहीं)/i.test((a || '').trim());

  (interview.responses || []).forEach((r) => {
    const a = r.answer;
    if (r.questionId === 'q_duration') s.duration = a;
    if (r.questionId === 'q_severity') s.severity = a;
    if (r.questionId === 'q_symptoms') s.symptoms = (r.extractedData?.symptoms?.length ? r.extractedData.symptoms : a.split(',').map((x) => x.trim())).filter(Boolean);
    if (r.questionId === 'q_conditions_specify') s.medicalHistory.push(a);
    if (r.questionId === 'q_meds_specify') s.medications.push(a);
    if (r.questionId === 'q_allergies' && yes(a)) s.allergies.push('Patient reports allergies (details not collected)');
    if (r.questionId === 'q_admitted' && yes(a)) s.previousAdmissions.push('Patient reports previous hospital admission for this issue');
    s.relevantResponses.push(`Q: ${r.question} | A: ${a}`);
  });

  const parts = [`Patient reports ${s.chiefComplaint}${s.duration ? ` for ${s.duration}` : ''}.`];
  if (s.severity) parts.push(`Self-rated severity: ${s.severity}.`);
  if (s.symptoms.length) parts.push(`Associated symptoms: ${s.symptoms.join(', ')}.`);
  parts.push(s.medicalHistory.length ? `Known conditions: ${s.medicalHistory.join('; ')}.` : 'No medical conditions reported.');
  parts.push(s.medications.length ? `Medications: ${s.medications.join('; ')}.` : 'No medications reported.');
  parts.push(s.allergies.length ? 'Patient reports allergies.' : 'No allergies reported.');
  parts.push('(Auto-generated from the patient\'s answers because the AI service was unavailable. Please review the raw responses.)');
  s.aiSummaryText = parts.join(' ');
  return s;
}
