# Brief: detailed audience profiles (guesstimates with sources)

Today is 2026-11-09. The site lists every app in NPCI's August 2026 "UPI Applications" table. For each app
you're assigned, write a **detailed demographic estimate** of who the app's users or target users are.

The owner wants *guesstimates*, not "broad audience". Avoid vague labels like "broad audience", "mixed consumer
groups" or "everyone". Commit to a best estimate of the typical user (e.g. "mostly 21–35, metro and tier-1,
salaried, middle income, skews male"). But every estimate must be backed by at least one real source you
actually opened. Sources do **not** need to be official: reputable press (ET, Mint, Moneycontrol, Business
Standard, Inc42, Entrackr, YourStory, The Ken, MediaNama, TechCrunch), company blog posts, founder interviews,
investor decks, DRHP/IPO filings, annual reports, industry reports (Redseer, Bain, Kalaari, PwC, NPCI/RBI),
app store listings, the company's own marketing pages, and well-known fintech blogs/newsletters are all fine.
Avoid AI-generated SEO spam sites.

`input.json` in this folder has each app's `firstGuess` (the owner liked these). Start from them; find evidence
that supports, sharpens or corrects them. If evidence contradicts a first guess, follow the evidence.

## Rules
- Use WebSearch to find pages and WebFetch to open them. Only cite URLs you successfully fetched (HTTP 200 with
  real content). If WebFetch fails on a JS page, you may cite it only if the search result snippet itself
  clearly shows the supporting text, and say so in `supports`.
- `basis`: `"stated"` when the source directly states the demographic (e.g. "70% of users are under 30",
  "built for teenagers", "for women"); `"inferred"` when it's your estimate reasoned from the source (e.g.
  product is a ₹500 small-ticket loan for first-time borrowers → lower income; positions on cashback to
  college students → 18–24). For inferred, `reason` must say what in the source led to the estimate.
- Banks: the table row covers all the bank's apps; estimate the bank's retail customer base (annual reports,
  press about customer mix, rural/urban branch share, age of digital users, etc.).
- If you truly find nothing for one dimension, still give a cautious estimate with `basis: "inferred"`,
  cite the closest relevant source (e.g. the product page), and make `reason` honest about how weak it is.
- Be concise. `value` under 60 characters. `reason` one or two sentences.

## Output
Write a JSON object keyed by the exact app name to the output path you were given:

```json
{
  "Navi": {
    "headline": "Young, salaried and first-time investors in tier-1 and tier-2 India chasing low-cost loans and UPI cashback",
    "tags": ["young_adults", "tier2_3", "salaried", "middle_income", "borrowers"],
    "dimensions": [
      {"key": "age", "value": "Mostly 22–35", "basis": "inferred", "reason": "...", "sources": ["prof-navi-1"]},
      {"key": "location", "value": "...", "basis": "stated", "reason": "...", "sources": ["prof-navi-2"]},
      {"key": "employment", "value": "...", "basis": "...", "reason": "...", "sources": ["..."]},
      {"key": "income", "value": "...", "basis": "...", "reason": "...", "sources": ["..."]},
      {"key": "gender", "value": "...", "basis": "...", "reason": "...", "sources": ["..."]}
    ],
    "caveats": ["optional short caveats"],
    "sources": [
      {"id": "prof-navi-1", "url": "https://...", "title": "Page title", "publisher": "Publisher", "checked": "2026-11-09",
       "supports": "One sentence on what this page says that supports the estimate (quote short phrases)."}
    ]
  }
}
```

- `dimensions`: exactly five, keys `age`, `location`, `employment`, `income`, `gender`, in that order.
- `headline`: one specific sentence, under 140 characters, no "broad"/"everyone".
- `tags`: 2–6 from this fixed list only:
  `teens` (under 18), `gen_z` (18–25), `young_adults` (25–35), `older_adults` (35+),
  `metro` (metros & tier-1), `tier2_3` (tier-2/3 towns), `rural`,
  `students`, `salaried`, `self_employed`, `gig_workers`, `merchants`,
  `low_income` (low income / new to credit), `middle_income`, `affluent` (high spenders / premium),
  `women` (only if women are a stated or clear skew), `borrowers`, `investors`, `card_holders`, `businesses`.
- Source ids: `prof-<slug>-<n>` using the app's `slug` from input.json. Every id used in `dimensions` must be
  in that app's `sources`. URLs must start with `https://`.

Validate before finishing: `python3 -I -c "import json;d=json.load(open('PATH'));print(len(d))"`.
Final message: one line per app with the headline. Nothing else.
