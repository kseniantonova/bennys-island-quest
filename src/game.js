const screens = [...document.querySelectorAll(".screen")];
const question = document.querySelector("#question");
const pointsContainer = document.querySelector("#map-points");
const hint = document.querySelector("#map-hint-text");
const progress = document.querySelector("#map-progress");
const bennyMarker = document.querySelector("#benny-marker");
const storyMoment = document.querySelector("#story-moment");
const answerForm = document.querySelector("#answer-form");
const answerControls = document.querySelector("#answer-controls");
const feedback = document.querySelector("#feedback");
const checkButton = document.querySelector("#check");
const continueButton = document.querySelector("#continue");
const helpBlock = document.querySelector("#help-block");
const revealedAnswer = document.querySelector("#revealed-answer");
const gotItButton = document.querySelector("#got-it");
// Per-checkpoint session state, independent of challenge content and map coordinates.
const checkpointProgress = Object.fromEntries(MAP_POINTS.map(point => [point.id, { wrongAttempts: 0, usedHelp: false }]));
let answerRevealed = false;
let activeIndex = 0;
let currentChallenge = null;
let answerCorrect = false;
let orderedWords = [];
// activeIndex is also the number of completed challenges.
// Only ready permits opening a checkpoint; moving/story keep the next one locked.
let routePhase = "ready";
let journeyVersion = 0;

function showScreen(id) {
  screens.forEach(screen => { screen.hidden = screen.id !== id; });
  document.querySelector(`#${id} h1, #${id} h2`).focus();
  window.scrollTo(0, 0);
}

function renderPoints() {
  pointsContainer.replaceChildren();
  MAP_POINTS.forEach((point, index) => {
    const state = index < activeIndex ? "completed" : index === activeIndex && routePhase === "ready" ? "active" : "locked";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-point ${state}`;
    button.dataset.state = state;
    button.textContent = point.label;
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.disabled = state !== "active";
    button.setAttribute("aria-label", `${point.label}, ${state}`);
    if (state === "active") button.setAttribute("aria-current", "step");
    button.addEventListener("click", () => {
      if (index === activeIndex && routePhase === "ready" && !question.open) openQuestion(point);
    });
    pointsContainer.append(button);
  });
  progress.textContent = `${activeIndex} / ${MAP_POINTS.length}`;
  hint.textContent = routePhase === "moving" ? "Great! Keep going. Benny is moving…"
    : routePhase === "story" ? "Continue Benny’s journey."
    : activeIndex === MAP_POINTS.length ? "All challenges completed!"
    : activeIndex === 0 ? "Choose START to begin." : `Choose ${MAP_POINTS[activeIndex].label} to continue.`;
}

function addTextInput(labelText, placeholder) {
  const label = document.createElement("label");
  label.className = "answer-label";
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "answer-input";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.spellcheck = false;
  label.append(input);
  answerControls.append(label);
}

function renderWordOrder() {
  answerControls.replaceChildren();
  const result = document.createElement("p");
  result.className = "word-result";
  result.setAttribute("aria-live", "polite");
  result.textContent = orderedWords.length
    ? orderedWords.map(index => currentChallenge.options[index]).join(" ") : "Choose the words in order.";
  answerControls.append(result);
  const words = document.createElement("div");
  words.className = "word-options";
  currentChallenge.options.forEach((word, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary word-option";
    button.textContent = word;
    button.disabled = orderedWords.includes(index);
    button.addEventListener("click", () => {
      orderedWords.push(index);
      feedback.textContent = "";
      renderWordOrder();
      (answerControls.querySelector(".word-option:not(:disabled)") || checkButton).focus();
    });
    words.append(button);
  });
  answerControls.append(words);
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "secondary word-reset";
  reset.textContent = "RESET WORDS";
  reset.addEventListener("click", () => {
    orderedWords = [];
    feedback.textContent = "";
    renderWordOrder();
    answerControls.querySelector("button").focus();
  });
  answerControls.append(reset);
}

function openQuestion(point) {
  currentChallenge = CHALLENGES.find(challenge => challenge.checkpoint === point.id);
  answerCorrect = false;
  orderedWords = [];
  feedback.textContent = "";
  feedback.className = "feedback";
  checkButton.hidden = false;
  continueButton.hidden = true;
  resetHelpUI();
  document.querySelector("#question-stop").textContent = point.label;
  document.querySelector("#question-title").textContent = currentChallenge.instruction;
  document.querySelector("#question-prompt").textContent = currentChallenge.prompt;
  const questionHint = document.querySelector("#question-hint");
  questionHint.textContent = currentChallenge.hint || "";
  questionHint.hidden = !currentChallenge.hint;
  answerControls.replaceChildren();
  switch (currentChallenge.type) {
    case "multipleChoice": {
      const group = document.createElement("fieldset");
      group.className = "choice-options";
      const legend = document.createElement("legend");
      legend.textContent = "Choose an answer";
      group.append(legend);
      currentChallenge.options.forEach(option => {
        const label = document.createElement("label");
        label.className = "choice-option";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "answer";
        radio.value = option;
        radio.defaultChecked = false;
        radio.checked = false;
        label.append(radio, document.createTextNode(option));
        group.append(label);
      });
      answerControls.append(group);
      break;
    }
    case "wordOrder": renderWordOrder(); break;
    case "finalChallenge":
      addTextInput("First blank (study)", "First answer");
      addTextInput("Second blank (have)", "Second answer");
      break;
    case "gapFill": addTextInput("Missing words", "Type the missing words"); break;
    case "makeQuestion": addTextInput("Your question", "Type the complete question"); break;
    case "makeNegative": addTextInput("Negative sentence", "Type the complete sentence"); break;
    case "errorCorrection": addTextInput("Corrected sentence", "Type the corrected sentence"); break;
  }
  question.showModal();
  if (currentChallenge.type === "multipleChoice") {
    // Native dialog focus must not leave the first radio looking selected.
    answerControls.querySelectorAll('input[type="radio"]').forEach(radio => { radio.checked = false; });
  }
  if (checkpointProgress[point.id].usedHelp) revealCorrectAnswer();
  else if (currentChallenge.type === "multipleChoice") {
    const title = document.querySelector("#question-title");
    title.tabIndex = -1;
    title.focus();
  }
  else answerControls.querySelector("input, button").focus();
}

function resetHelpUI() {
  answerRevealed = false;
  helpBlock.hidden = true;
  revealedAnswer.hidden = true;
  gotItButton.hidden = true;
  document.querySelector("#correct-answer-text").textContent = "";
}

function revealCorrectAnswer() {
  if (!question.open || !currentChallenge || answerCorrect || answerRevealed) return;
  checkpointProgress[currentChallenge.checkpoint].usedHelp = true;
  answerRevealed = true;
  helpBlock.hidden = true;
  feedback.textContent = "";
  document.querySelector("#correct-answer-text").textContent = currentChallenge.correctAnswer;
  revealedAnswer.hidden = false;
  answerControls.querySelectorAll("input, button").forEach(control => { control.disabled = true; });
  checkButton.hidden = true;
  gotItButton.hidden = false;
  gotItButton.focus();
}

document.querySelector("#show-answer").addEventListener("click", revealCorrectAnswer);
document.querySelector("#try-again").addEventListener("click", () => {
  helpBlock.hidden = true;
  answerControls.querySelector("input:not(:disabled), button:not(:disabled)")?.focus();
});
gotItButton.addEventListener("click", () => {
  if (answerRevealed) completeCheckpoint();
});

function readAnswer() {
  if (currentChallenge.type === "multipleChoice") return answerControls.querySelector("input:checked")?.value || "";
  if (currentChallenge.type === "wordOrder") return orderedWords.map(index => currentChallenge.options[index]).join(" ");
  const values = [...answerControls.querySelectorAll('input[type="text"]')].map(input => input.value);
  return currentChallenge.type === "finalChallenge" ? values.map(normalizeAnswer) : values[0];
}

answerForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!question.open || answerCorrect || answerRevealed || !currentChallenge) return;
  const answer = readAnswer();
  if (currentChallenge.type === "multipleChoice" && !answer) {
    feedback.textContent = "Choose an answer first.";
    feedback.className = "feedback";
    return;
  }
  answerCorrect = isCorrectAnswer(currentChallenge, answer);
  feedback.textContent = currentChallenge.feedback[answerCorrect ? "correct" : "incorrect"];
  feedback.className = `feedback ${answerCorrect ? "correct" : "incorrect"}`;
  if (answerCorrect) {
    completeCheckpoint();
  } else {
    const state = checkpointProgress[currentChallenge.checkpoint];
    state.wrongAttempts += 1;
    if (state.wrongAttempts >= 3) {
      helpBlock.hidden = false;
      document.querySelector("#show-answer").focus();
    }
  }
});

function completeCheckpoint() {
  if (!question.open || routePhase !== "ready") return;
  answerCorrect = true;
  activeIndex += 1;
  routePhase = "moving";
  renderPoints();
  answerControls.querySelectorAll("input, button").forEach(control => { control.disabled = true; });
  checkButton.hidden = true;
  closeQuestion();
}

function closeQuestion() {
  if (!question.open) return;
  question.close();
  answerControls.querySelectorAll('input[type="radio"]').forEach(radio => { radio.checked = false; });
  if (answerCorrect) advanceJourney();
  else pointsContainer.querySelector('[aria-current="step"]')?.focus();
}

function positionBenny(point) {
  bennyMarker.dataset.checkpoint = point.id;
  bennyMarker.style.left = `${point.x}%`;
  bennyMarker.style.top = `${point.y}%`;
}

async function advanceJourney() {
  const version = journeyVersion;
  if (activeIndex === MAP_POINTS.length) {
    routePhase = "finished";
    showScreen("finish");
    return;
  }
  const nextPoint = MAP_POINTS[activeIndex];
  bennyMarker.setAttribute("aria-label", `Benny moving to ${nextPoint.label}`);
  // Flush the current position, then wait for the actual CSS transitions.
  bennyMarker.getBoundingClientRect();
  positionBenny(nextPoint);
  bennyMarker.getBoundingClientRect();
  await Promise.all(bennyMarker.getAnimations().map(animation => animation.finished.catch(() => {})));
  if (version !== journeyVersion) return;
  bennyMarker.setAttribute("aria-label", `Benny at ${nextPoint.label}`);
  const story = STORY_MOMENTS.find(moment => moment.checkpoint === MAP_POINTS[activeIndex - 1].id);
  if (story) {
    routePhase = "story";
    renderPoints();
    document.querySelector("#story-text").textContent = story.lines[0];
    document.querySelector("#story-detail").textContent = story.lines[1];
    storyMoment.showModal();
    document.querySelector("#story-continue").focus();
  } else activateNextPoint();
}

function activateNextPoint() {
  routePhase = "ready";
  renderPoints();
  pointsContainer.querySelector('[aria-current="step"]')?.focus();
}

function resetJourney() {
  journeyVersion += 1;
  activeIndex = 0;
  currentChallenge = null;
  answerCorrect = false;
  orderedWords = [];
  Object.values(checkpointProgress).forEach(state => {
    state.wrongAttempts = 0;
    state.usedHelp = false;
  });
  resetHelpUI();
  answerControls.replaceChildren();
  feedback.textContent = "";
  feedback.className = "feedback";
  checkButton.hidden = false;
  continueButton.hidden = true;
  routePhase = "ready";
  if (question.open) question.close();
  if (storyMoment.open) storyMoment.close();
  bennyMarker.classList.add("reset-position");
  positionBenny(MAP_POINTS[0]);
  bennyMarker.getBoundingClientRect();
  bennyMarker.classList.remove("reset-position");
  bennyMarker.setAttribute("aria-label", "Benny at START");
  renderPoints();
}

document.querySelector("#story-continue").addEventListener("click", () => {
  if (routePhase !== "story" || !storyMoment.open) return;
  storyMoment.close();
  activateNextPoint();
});
storyMoment.addEventListener("cancel", event => event.preventDefault());

document.querySelector("#start").addEventListener("click", () => {
  resetJourney();
  showScreen("map");
});
document.querySelector("#close").addEventListener("click", closeQuestion);
continueButton.addEventListener("click", closeQuestion);
question.addEventListener("cancel", event => {
  event.preventDefault();
  closeQuestion();
});
document.querySelector("#again").addEventListener("click", () => {
  resetJourney();
  showScreen("intro");
});
resetJourney();
