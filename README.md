# thomashuelskamp.com

Personal portfolio site, hosted free on GitHub Pages with a custom domain from Cloudflare.

```
index.html            page layout (rarely touched)
style.css             design
app.js                carousel, pages, 3D viewer
content/projects.json all project text, photos and models   ← you edit this
content/site.json     about text, portrait, email, links    ← and this
images/<project-id>/  photos for each project
models/               .stl files
CNAME                 tells GitHub Pages the domain (thomashuelskamp.com)
```

---

## Part 1 — Put the site on GitHub (one time, ~5 min)

1. Sign in at **github.com** → click **+** (top right) → **New repository**.
2. Name it `thomashuelskamp.com` (any name works). Set it to **Public**. Don't add a README. Click **Create repository**.
3. On the empty repo page, click **uploading an existing file**.
4. Unzip `thomashuelskamp-site.zip`. Open the folder and drag **everything inside it** (not the folder itself) into the upload box.
   - `.nojekyll` is a hidden file and is optional. To include it on a Mac, press **Cmd + Shift + .** in Finder to show hidden files.
5. Click **Commit changes**.

## Part 2 — Turn on GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**: Source = **Deploy from a branch**, Branch = **main**, folder = **/ (root)**. Click **Save**.
3. After a minute or two, the page shows a link to the live site. Leave this tab open.

## Part 3 — Verify the domain with GitHub (recommended)

This proves you own the domain, so nobody else can point it at their GitHub Pages.

1. Click your profile picture → **Settings** (your account settings, not the repo's) → **Pages** in the left sidebar.
2. Click **Add a domain**, enter `thomashuelskamp.com`, and click **Add domain**.
3. GitHub shows a **TXT record** with a name like `_github-pages-challenge-YOURUSERNAME` and a random value. Keep this tab open.
4. In a new tab, open **dash.cloudflare.com** → click **thomashuelskamp.com** → **DNS → Records** → **Add record**:
   - Type: `TXT`
   - Name: `_github-pages-challenge-YOURUSERNAME` (paste exactly what GitHub shows)
   - Content: the value GitHub shows
   - Click **Save**
5. Back on GitHub, click **Verify**. If it fails, wait a few minutes and try again.

## Part 4 — Point the domain at GitHub (Cloudflare DNS)

Still in Cloudflare → **thomashuelskamp.com → DNS → Records**.

1. **Delete** any existing `A`, `AAAA` or `CNAME` records named `thomashuelskamp.com` (shown as `@`) or `www`. New domains often have none.
2. Add these records. For each one, set **Proxy status to "DNS only"** (grey cloud, not orange).

| Type  | Name  | Content                     |
|-------|-------|-----------------------------|
| A     | `@`   | `185.199.108.153`           |
| A     | `@`   | `185.199.109.153`           |
| A     | `@`   | `185.199.110.153`           |
| A     | `@`   | `185.199.111.153`           |
| AAAA  | `@`   | `2606:50c0:8000::153`       |
| AAAA  | `@`   | `2606:50c0:8001::153`       |
| AAAA  | `@`   | `2606:50c0:8002::153`       |
| AAAA  | `@`   | `2606:50c0:8003::153`       |
| CNAME | `www` | `YOURUSERNAME.github.io`    |

Replace `YOURUSERNAME` with your GitHub username (lowercase, no repo name).

**Keep the grey cloud.** GitHub has to issue its own HTTPS certificate, and Cloudflare's orange-cloud proxy gets in the way of that.

## Part 5 — Connect the domain and turn on HTTPS

1. Back in the **repo → Settings → Pages**, the **Custom domain** box should already say `thomashuelskamp.com` (from the `CNAME` file). If not, type it in and click **Save**.
2. Wait for the **DNS check** to pass. This usually takes minutes, occasionally a few hours.
3. Tick **Enforce HTTPS**. If it's greyed out, GitHub is still issuing the certificate; check back within an hour (it can take up to 24 hours).
4. Visit **https://thomashuelskamp.com** and **https://www.thomashuelskamp.com**. Both should show the site.

---

## Editing the site

Every change you commit goes live in about a minute. Refresh with **Cmd/Ctrl + Shift + R** if you still see the old version.

**Editing on github.com:** open a file → click the **pencil** icon → edit → **Commit changes**.
**Editing many files at once:** in the repo, press the **.** key to open a full editor in the browser.

### Change text

Open `content/projects.json`. Each project looks like this:

```json
{
  "id": "project-one",
  "title": "Project One",
  "year": "2026",
  "photos": ["images/project-one/1.jpg", "images/project-one/2.jpg"],
  "model": "models/project-one.stl",
  "summary": "Shown on the card on the Work page.",
  "overview": "First section of the project page.",
  "process": "Second section.",
  "results": "Third section."
}
```

- `photos`: in the order they appear. `""` shows an empty placeholder frame.
- `model`: path to an `.stl`, or `null` for no 3D viewer.
- `id`: lowercase with hyphens. It becomes the page address, e.g. `thomashuelskamp.com/#p-project-one`.

About text, portrait, experience/education, skills, email and links are in `content/site.json`. Each experience entry has `years`, `what` (role or degree) and `where` (organization or school); list them newest first. To hide the experience or skills section, make its list empty: `[]`.

**JSON rules:** text goes in "double quotes", items are separated by commas, and there's **no comma after the last item** in a list. If the site shows "Couldn't read content/…", that file has a typo; paste it into jsonlint.com to find the line.

### Add photos

1. Open the `images` folder → **Add file → Upload files**. Upload into `images/<project-id>/`. (To make a new folder, type `project-two/` before the file name in the upload path, or use the **.** editor.)
2. List the files in that project's `photos`.

Tips:
- **File names are case-sensitive.** `Photo1.JPG` and `photo1.jpg` are different files. Lowercase names avoid surprises.
- Resize to about **2000 px wide, JPG, under 500 KB** each. Phone photos straight off the camera make the site slow.
- Photos are cropped to 4:3 on cards and 3:2 on project pages, so keep the subject centered.

### Add a portrait

Upload it to `images/`, then set `"portrait": "images/portrait.jpg"` in `content/site.json`. Portraits are cropped to 4:5.

### Add a 3D model

1. Export from CAD as **binary STL, in millimeters**.
2. Upload it to `models/`.
3. Set `"model": "models/your-file.stl"` on the project.

Keep files **under ~10 MB** so they load quickly. GitHub's web upload allows up to 25 MB per file. For heavy meshes, reduce the triangle count first; SolidWorks and Fusion have export resolution settings, and Blender has a "Decimate" modifier.

Z-up models are stood upright automatically.

### Add, reorder or remove a project

- **Add:** copy a whole `{ … }` block in `projects.json`, paste it after another one with a comma between them, and give it a new `id`.
- **Reorder:** move blocks. The Work grid follows the file's order.
- **Remove:** delete the block, and the comma before it if it was the last one.

### Preview before publishing (optional)

On your computer, in the site folder, run:

```
python3 -m http.server
```

Then open http://localhost:8000. Opening `index.html` directly by double-clicking won't work, because the browser blocks it from reading the JSON files.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank page, message about `content/…json` | JSON typo, see "JSON rules" above |
| Photo shows as broken | Path or capitalization in `photos` doesn't match the file name |
| 3D viewer says "Couldn't find …" | Check the `model` path and file name |
| Domain shows a GitHub 404 | Custom domain not saved in Settings → Pages, or `CNAME` file deleted |
| "Enforce HTTPS" greyed out | Certificate still being issued. Wait, and confirm Cloudflare records are grey-cloud |
| `www` doesn't work | Check the `CNAME www → YOURUSERNAME.github.io` record |
