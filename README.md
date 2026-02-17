# fuzzy-typo-corrector-web

A local Next.js web application that detects and corrects single-word typos using a fuzzy logic inference system (FIS).

## Stack

- Next.js (App Router) + TypeScript
- TailwindCSS
- Vitest
- ESLint + Prettier

No external APIs or third-party correction services are used.

## Features

- Input controls:
  - `word`
  - `language` (`tr` / `en` / `ar`)
  - `max edit distance`
  - `result count`
  - `fuzzy profile` (`strict`, `balanced`, `forgiving`)
- Candidate generation from local dictionaries in `data/wordlists`
- Feature extraction:
  - `editDistance`
  - `normalizedDistance`
  - `keyboardProximityScore`
  - `lengthDiff`
  - `prefixSimilarity`
- Mamdani-style fuzzy inference:
  - Fuzzification
  - Rule evaluation
  - Aggregation
  - Centroid defuzzification (`0-100`)
- Ranked suggestions with explanation and debug panel

## Folder Structure

```text
src/
  app/
    page.tsx
    api/
      correct/route.ts
  lib/
    fuzzy/
      config.ts
      membership.ts
      rules.ts
      inference.ts
      defuzzify.ts
      explain.ts
      levenshtein.ts
      keyboard/
        tr_q_layout.ts
        qwerty_layout.ts
        proximity.ts
    candidates/
      generateCandidates.ts
    features/
      extractFeatures.ts

data/
  wordlists/
    tr.txt
    en.txt
    ar.txt

tests/
  levenshtein.test.ts
  membership.test.ts
  inference.test.ts
  candidates.test.ts
  proximity.test.ts
  quality.test.ts

scripts/
  refresh-wordlists.mjs
```

## API

### POST `/api/correct`

Request:

```json
{
  "word": "bilgsayar",
  "lang": "tr",
  "maxDistance": 2,
  "topK": 10,
  "profile": "balanced"
}
```

Response (example):

```json
{
  "input": "bilgsayar",
  "score": 90.2,
  "best": "bilgisayar",
  "candidates": []
}
```

The response also includes per-candidate features, fuzzy output label, and debug explanation.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```

## Quality

```bash
npm run lint
npm run format
```

## Refresh Wordlists

The project includes a wordlist refresh script that rebuilds local dictionaries from curated public sources.

```bash
npm run wordlists:refresh
```

Current generated sizes (after refresh):

- `data/wordlists/en.txt`: ~19,900 words
- `data/wordlists/ar.txt`: ~39,000 words
- `data/wordlists/tr.txt`: ~34,500 words

## Notes

- Wordlists are local text files and can be extended without code changes.
- The fuzzy profile changes sensitivity/weighting and candidate filtering strictness.
