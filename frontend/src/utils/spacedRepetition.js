const STORAGE_KEY = "eduai_spaced_rep";

// Load all spaced repetition data
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Save data
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Get card key (unique per document + card content)
function cardKey(documentId, card) {
  return `${documentId}_${card.front?.substring(0, 40)}`;
}

/**
 * Record a response for a flashcard
 * @param {number} documentId
 * @param {object} card - flashcard object with front/back
 * @param {'wrong'|'hard'|'good'|'easy'} rating
 */
export function recordResponse(documentId, card, rating) {
  const data = loadData();
  const key = cardKey(documentId, card);

  const existing = data[key] || {
    confidence: 0,
    reviews: 0,
    lastReview: null,
    streak: 0,
  };

  const now = Date.now();
  existing.lastReview = now;
  existing.reviews += 1;

  switch (rating) {
    case "wrong":
      existing.confidence = Math.max(0, existing.confidence - 1);
      existing.streak = 0;
      break;
    case "hard":
      existing.confidence = Math.min(1, existing.confidence);
      existing.streak = 0;
      break;
    case "good":
      existing.confidence = Math.min(3, existing.confidence + 1);
      existing.streak += 1;
      break;
    case "easy":
      existing.confidence = 3;
      existing.streak += 1;
      break;
    default:
      break;
  }

  data[key] = existing;
  saveData(data);
}

/**
 * Get confidence level for a card
 * @returns {number} 0-3
 */
export function getCardConfidence(documentId, card) {
  const data = loadData();
  const key = cardKey(documentId, card);
  return data[key]?.confidence || 0;
}

/**
 * Get review stats for a card
 */
export function getCardStats(documentId, card) {
  const data = loadData();
  const key = cardKey(documentId, card);
  return (
    data[key] || { confidence: 0, reviews: 0, lastReview: null, streak: 0 }
  );
}

/**
 * Sort flashcards for spaced repetition
 * Cards with lower confidence come first, then cards not reviewed recently
 * @param {number} documentId
 * @param {array} cards - array of flashcard objects
 * @returns {array} sorted cards (weakest first)
 */
export function sortBySpacedRepetition(documentId, cards) {
  const data = loadData();

  return [...cards].sort((a, b) => {
    const keyA = cardKey(documentId, a);
    const keyB = cardKey(documentId, b);
    const statsA = data[keyA] || { confidence: 0, reviews: 0, lastReview: 0 };
    const statsB = data[keyB] || { confidence: 0, reviews: 0, lastReview: 0 };

    // Lower confidence first
    if (statsA.confidence !== statsB.confidence) {
      return statsA.confidence - statsB.confidence;
    }

    // If same confidence, show less recently reviewed first
    return (statsA.lastReview || 0) - (statsB.lastReview || 0);
  });
}

/**
 * Get overall mastery stats for a document's flashcards
 * @returns {{ total, mastered, learning, unseen, masteryPercent }}
 */
export function getDocumentMastery(documentId, cards) {
  const data = loadData();
  let mastered = 0,
    learning = 0,
    unseen = 0;

  cards.forEach((card) => {
    const key = cardKey(documentId, card);
    const stats = data[key];
    if (!stats || stats.reviews === 0) unseen++;
    else if (stats.confidence >= 3) mastered++;
    else learning++;
  });

  return {
    total: cards.length,
    mastered,
    learning,
    unseen,
    masteryPercent:
      cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0,
  };
}

/**
 * Get confidence label and color
 */
export function getConfidenceDisplay(confidence, reviews = 0) {
  if (reviews === 0)
    return {
      label: "New",
      color: "rgba(255,255,255,0.4)",
      bg: "rgba(255,255,255,0.06)",
    };
  if (confidence >= 3)
    return { label: "Got It", color: "#6BCF7F", bg: "rgba(107,207,127,0.12)" };
  return {
    label: "Needs Review",
    color: "#F5576C",
    bg: "rgba(245,87,108,0.12)",
  };
}

export function resetDocument(documentId) {
  const data = loadData();
  const prefix = `${documentId}_`;
  Object.keys(data).forEach((key) => {
    if (key.startsWith(prefix)) delete data[key];
  });
  saveData(data);
}
