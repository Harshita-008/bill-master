export function compactItemSearch(value) {
  return String(value ?? "").replace(/[^\p{L}\p{N}]+/gu, "");
}

function wordsOf(value) {
  return String(value ?? "").toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// name words start the search in this order, other words may sit between them
function matchesOrderedWords(name, search) {
  const words = wordsOf(name);
  const fromWord = (wordIndex, searchIndex) => {
    if (searchIndex >= search.length) return true;
    const remaining = search.slice(searchIndex);

    for (let index = wordIndex; index < words.length; index += 1) {
      const word = words[index];
      if (word.startsWith(remaining)) return true;
      if (remaining.startsWith(word) && fromWord(index + 1, searchIndex + word.length)) return true;
    }
    return false;
  };
  return fromWord(0, 0);
}

// words the user typed with spaces between them
function typedWords(query) {
  return String(query ?? "").trim().split(/\s+/).map(compactItemSearch).map((word) => word.toLocaleLowerCase()).filter(Boolean);
}

// two or more typed words, each starting a word of the name, any order ("teju drum" finds "DRUM TEJU")
function hasAllWords(name, query) {
  const typed = typedWords(query);
  if (typed.length < 2) return false;
  const words = wordsOf(name);
  return typed.every((part) => words.some((word) => word.startsWith(part)));
}

// joined typed words, each one starting a different name word, any order ("tejudrum" finds "DRUM TEJU")
function matchesJoinedAnyOrder(name, search) {
  const words = wordsOf(name);
  const fromRest = (remaining, used) => words.some((word, index) => {
    if (used.has(index)) return false;
    if (word.startsWith(remaining)) return true;
    return remaining.startsWith(word) && fromRest(remaining.slice(word.length), new Set(used).add(index));
  });
  return fromRest(search, new Set());
}

// 0 = typed text sits together in the name, 1 = in order with words between,
// 2 = all words in any order, -1 = no match
export function itemSearchRank(name, query) {
  const search = compactItemSearch(query).toLocaleLowerCase();
  if (!search) return 0;
  if (compactItemSearch(name).toLocaleLowerCase().includes(search)) return 0;
  if (matchesOrderedWords(name, search)) return 1;
  if (hasAllWords(name, query) || matchesJoinedAnyOrder(name, search)) return 2;
  return -1;
}

export function matchesItemSearch(name, query) {
  return itemSearchRank(name, query) !== -1;
}

// matching items, closest first; one typed word keeps the old a to z list on top
export function searchItems(items, query) {
  const oneWord = typedWords(query).length < 2;
  return items
    .map((item) => {
      const rank = itemSearchRank(item.name, query);
      return { item, rank: oneWord && rank === 1 ? 0 : rank };
    })
    .filter((entry) => entry.rank !== -1)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.item);
}
