function normalizeAnswer(value) {
  return String(value).toLowerCase().replace(/[‘’]/g, "'")
    .trim().replace(/\s+/g, " ").replace(/\s+([,.?])/g, "$1")
    .replace(/\.$/, "").trim();
}

function isCorrectAnswer(challenge, answer) {
  if (challenge.type === "multipleChoice") return answer === challenge.correctAnswer;
  const candidates = [challenge.correctAnswer, ...(challenge.acceptedAnswers || [])];
  const submitted = normalizeAnswer(Array.isArray(answer) ? answer.join(" / ") : answer);
  return candidates.some(candidate => normalizeAnswer(candidate) === submitted);
}
