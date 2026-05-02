# PSLE RevisionPro 🎒

A Botswana PSLE revision platform for Standard 6 & 7 students.
Built with React + Vite, Supabase, and deployable to Cloudflare Pages.

---

## Tech Stack

| Layer       | Tool                     |
|-------------|--------------------------|
| Frontend    | React 18 + Vite 5        |
| Routing     | React Router v6          |
| Auth & DB   | Supabase                 |
| Hosting     | Cloudflare Pages         |
| Fonts       | Cormorant Garamond + Outfit (Google Fonts) |

---

## Project Structure

```
src/
├── context/        AuthContext.jsx      (auth state, session, profile)
├── lib/            supabase.js          (Supabase client)
├── data/           scienceQuestions.js  (quiz question bank)
├── styles/         index.css            (global CSS + design tokens)
├── components/
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx
└── pages/
    ├── Landing.jsx       /
    ├── StudentAuth.jsx   /student-auth
    ├── ParentAuth.jsx    /parent-auth  (with consent flow)
    ├── TutorAuth.jsx     /tutor-auth
    ├── Dashboard.jsx     /dashboard    (protected)
    ├── SubjectList.jsx   /subjects     (protected)
    ├── Quiz.jsx          /quiz/:subject (protected)
    └── Results.jsx       /results      (protected)
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/psle-revisionpro.git
cd psle-revisionpro
npm install
```

### 2. Create `.env` file

```bash
cp .env.example .env
```

Then fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the SQL in `supabase/schema.sql`
3. Enable **Email Auth** under Authentication → Providers

### 4. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## Supabase Schema

See `supabase/schema.sql` for the full setup script.

Tables created:
- `profiles` — user profile data (role, name, grade, consent)
- `quiz_results` — score history per user per subject

---

## Deploy to Cloudflare Pages

### Connect GitHub → Cloudflare

1. Push this repo to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Click **Create Application → Connect to Git**
4. Select your repo
5. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **Deploy**

Every push to `main` will auto-deploy. ✓

---

## Colour Palette

| Token         | Hex       | Usage                    |
|---------------|-----------|--------------------------|
| `--forest`    | `#1B3D2F` | Primary, navbar, headers |
| `--gold`      | `#C9A84C` | Accents, badges, CTAs    |
| `--ivory`     | `#F5F0E8` | Page background          |
| `--sage`      | `#8FAF7E` | Progress bars, tags      |
| `--charcoal`  | `#2E3830` | Body text                |

---

## Extending the App

### Add more quiz subjects
Edit `src/pages/Quiz.jsx`:
```js
const QUIZ_CONFIGS = {
  science: { name: 'Science', emoji: '🔬', questions: scienceQuestions },
  maths:   { name: 'Mathematics', emoji: '🔢', questions: mathsQuestions },
}
```

### Add questions
Create `src/data/mathsQuestions.js` following the same structure as `scienceQuestions.js`.

---

## Legal / Compliance

- Parent consent flow built for **Botswana Data Protection Act 2018**
- Consent date and flags stored in `profiles` table
- Students under 18 require parental consent before account activation (parental signup flow handles this)

---

© 2025 PSLE RevisionPro. Built for Botswana students. 🇧🇼
