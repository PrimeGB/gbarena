export type SiteSearchResult = {
  id: string;
  title: string;
  href: string;
  type: string;
  description: string;
  keywords?: string;
  imageUrl?: string | null;
};

const stopWords = new Set(["a", "an", "and", "are", "do", "for", "how", "i", "in", "is", "my", "of", "on", "the", "to", "where"]);

export function searchTerms(query: string) {
  const words = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  const meaningful = words.filter((word) => !stopWords.has(word));
  return [...new Set(meaningful.length ? meaningful : words)].slice(0, 6);
}

export function searchFilter(query: string, columns: string[]) {
  const terms = searchTerms(query).slice(0, 4);
  const candidates = [...new Set(terms.flatMap((term) =>
    term.length >= 5 ? [term, term.slice(0, 3), term.slice(-3)] : [term],
  ))];
  return candidates.flatMap((term) => columns.map((column) => `${column}.ilike.%${term}%`)).join(",");
}

function isClose(a: string, b: string) {
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const first = [...a].findIndex((character, index) => character !== b[index]);
    if (first >= 0 && first + 1 < a.length &&
      a[first] === b[first + 1] && a[first + 1] === b[first] &&
      a.slice(first + 2) === b.slice(first + 2)) return true;
  }
  let i = 0;
  let j = 0;
  let differences = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      if (++differences > 1) return false;
      if (a.length >= b.length) i++;
      if (b.length >= a.length) j++;
    }
  }
  return differences + (a.length - i) + (b.length - j) <= 1;
}

export function rankSiteResults(query: string, results: SiteSearchResult[]) {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const phrase = terms.join(" ");
  return results.flatMap((result) => {
    const title = (result.title.toLowerCase().match(/[a-z0-9]+/g) || []).join(" ");
    const titleWords = title.split(" ");
    const words: string[] = `${title} ${result.description} ${result.keywords || ""}`
      .toLowerCase().match(/[a-z0-9]+/g) || [];
    let matched = 0;
    let score = title === phrase ? 500 : title.startsWith(phrase) ? 250 : title.includes(phrase) ? 160 : 0;
    for (const term of terms) {
      let value = 0;
      if (titleWords.includes(term)) value = 80;
      else if (titleWords.some((word) => word.startsWith(term))) value = 55;
      else if (term.length >= 2 && titleWords.some((word) => word.includes(term))) value = 40;
      else if (words.includes(term)) value = 35;
      else if (words.some((word) => word.startsWith(term))) value = 20;
      else if (term.length >= 2 && words.some((word) => word.includes(term))) value = 12;
      else if (words.some((word) => isClose(term, word))) value = 15;
      if (value) {
        matched++;
        score += value;
      }
    }
    if (matched < Math.ceil(terms.length / 2)) return [];
    score += Math.round((matched / terms.length) * 80);
    return [{ result, score }];
  }).sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
    .map(({ result }) => result);
}
