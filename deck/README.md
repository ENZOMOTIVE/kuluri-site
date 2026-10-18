# Deck

- **`kuluri_pitch.pptx` / `kuluri_pitch.pdf`** — the pitch deck for the EU Agri-Hackathon
  submission (Challenge 3). 21 slides: 1-12 the pitch, 13-21 backup for the jury's
  questions. Built in Canva by Juan Zotes Orcajo, with AI assistance for structure and
  wording; the PDF is a LibreOffice export of the same file.
- **`slides_data_and_ai.pptx` / `.pdf`** — two slides proposed for insertion into the deck:
  *What the data told us* (the dataset, the three findings from it and the feature each one
  drove) and *How we used AI* (the declaration the Hack Guide asks for). Built to the deck's
  own palette and type. `make_slides_data_and_ai.py` regenerates them with python-pptx;
  every figure on the data slide comes from `app/src/data/` and is listed in
  [`../DATA.md`](../DATA.md).
- **`team27_kuluri.pdf`** — the earlier draft deck by Maria Filippou (17 Oct).

The data behind the deck's claims, and the full AI-use declaration, are in
[`../DATA.md`](../DATA.md). The market figures are estimated, not measured — the
"How we estimated the numbers" backup slide sets out the method, and slides marked
"illustrative figures" are labelled as such.
