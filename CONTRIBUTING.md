# Contributing to Kuluri

Thank you for helping. These steps apply to team members and to anyone else.

## Before you start

- Read the [README](README.md) to run the app, and the [terms of use](TERMS.md).
- Find or open an issue, and say in it that you are working on it. Team members use the board [Kuluri, EU Agri-Hackathon](https://github.com/users/lindangulopez/projects/17).

## Making a change

1. **Team members**: create a branch in this repository. **Others**: fork it first.
2. Use one branch per issue, for example `git switch -c 14-voice-messages`.
3. Run the app and check your change: `cd app && npm run dev`, then `npm run build`.
4. Open a small pull request that says what changed and `Closes #14`. Someone else reviews it before it is merged.
5. In your first pull request, add yourself to [`AUTHORS.md`](AUTHORS.md), [`CITATION.cff`](CITATION.cff) and [`codemeta.json`](codemeta.json).

## Never commit

- The organisers' dataset (`dg-agri-hackathon-datasets/`, about 12 GB), its login, or any `*.sqlite` file.
- `.env` files, API keys or private keys (the OpenAI key, blockchain account keys).
- Real personal data. The prototype uses synthetic and simulated data only.

## Rules for the product

- Matching uses skills, availability, languages and distance only. Never nationality, age, gender or any other protected ground.
- Totals only for buyers and authorities. Personal data never leaves the farm without a legal basis.
- If AI does something in the product, say so in the UI and in the README.

## Licence

By contributing, you agree that:

- your code is released under the [MIT licence](app/LICENSE);
- your text and diagrams are released under [CC BY 4.0](LICENSE).
