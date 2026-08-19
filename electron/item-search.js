export function compactItemSearch(value) {
  return String(value ?? "").replace(/[^\p{L}\p{N}]+/gu, "");
}

export function matchesItemSearch(name, query) {
  const search = compactItemSearch(query).toLocaleLowerCase();
  if (!search) return true;

  const compactName = compactItemSearch(name).toLocaleLowerCase();
  if (compactName.includes(search)) return true;

  const words = String(name ?? "")
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  const matchesOrderedWords = (wordIndex, searchIndex) => {
    if (searchIndex >= search.length) return true;
    const remaining = search.slice(searchIndex);

    for (let index = wordIndex; index < words.length; index += 1) {
      const word = words[index];
      if (word.startsWith(remaining)) return true;
      if (
        remaining.startsWith(word)
        && matchesOrderedWords(index + 1, searchIndex + word.length)
      ) return true;
    }
    return false;
  };

  return matchesOrderedWords(0, 0);
}
