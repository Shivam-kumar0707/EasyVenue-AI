# EasyVenue AI

## Chosen Vertical

Organizer / Venue Staff

## Approach & Logic

EasyVenue AI is a single-screen real-time stadium operations dashboard designed specifically for venue staff, organizers, and emergency directors during major events (e.g. FIFA World Cup 2026). The central design principle is a **single shared live stadium state** stored in Firebase Firestore, serving as the single source of truth for both human operators and generative AI models.

Instead of running separate siloed workflows, every AI assistant capability in EasyVenue AI reasons over this unified live state. For instance, when the simulation engine updates crowd levels, the live UI changes via Firestore snapshot listeners, the in-memory anomaly detector calculates spikes, and the hourly summarizer digests recent reports. This architecture ensures complete alignment across human staff, system rules, and GenAI models, preventing split-second communication gaps.

By utilising a low-latency, real-time database coupled with event-driven Groq SDK calls, the application minimizes unnecessary API utilization. Generative AI operations are only executed when genuine spikes occur, or when an operator explicitly requests an hourly overview. The dashboard UI presents all of this in a modern, dark-themed operations center aesthetic.

## How It Works

1. **Simulation**: A background simulation engine runs on the dashboard using a recursive, ref-based timer every 6–8 seconds. It nudges crowd levels in individual stadium zones by -8 to +12 (simulating a filling crowd) and has a 10% chance of triggering a major crowd surge (+25 to +35) in a random zone. The simulator writes updates directly to Firestore.
2. **Classification**: When venue staff submit a free-text incident report, it is validated client-side and then sent to the Groq classifier. Groq parses the raw description, returning strict JSON containing the category, severity, and a one-sentence summary. The classified incident is saved directly in Firestore, placing the highest-severity issues at the top of the feed.
3. **Anomaly Detection**: The dashboard tracks crowd history within a 10-minute sliding window. When a zone jumps by >30% (e.g. during a simulated surge), the anomaly detector fires. It sends the before-and-after values to Groq to generate exactly one actionable, 15-word operations recommendation. This recommendation displays immediately as a dismissible orange alert banner.
4. **Summarization**: When the operator clicks "Summarize Last Hour", the system filters Firestore incident records from the last 60 minutes. If no incidents occurred, it immediately outputs a normal status message (skipping the API call). If incidents are present, it prompts Groq to compile them into exactly 3 concise, professional operations bullet points.
5. **Trend Visualization**: Each zone card features a custom, dependency-free SVG sparkline displaying the last 30 minutes of crowd level readings in real time, pulling from a Firestore subcollection pruned automatically to keep data lightweight.
6. **Announcement Drafting**: Organizers can enter a raw operational situation, and the AI announcement drafter uses Groq to generate a calm, professional PA announcement script (under 40 words) suitable to be broadcast. Drafted scripts are logged in the Firestore subcollection 'announcements' for audit purposes.

## Evaluation Criteria Coverage

- **Code Quality**: Structured into small, single-purpose React hooks (`useLiveCrowdData.js`, `useIncidents.js`, `useZoneHistory.js`, `useAnnouncements.js`) and AI functions. Consistent formatting is enforced with Prettier and ESLint, and zero linter errors were reported by oxlint.
- **Security**: The application utilizes a `.env` configuration file to keep sensitive Firebase and Groq SDK credentials secure. Free-text inputs are thoroughly trimmed and validated via `validateInput.js` to prevent malicious injection or overflow before reaching Firestore or Groq APIs.
- **Efficiency**: API calls are heavily optimized. Anomaly detection only prompts the Groq API when a verified >30% crowd spike occurs (not on every tick). Summarization checks for incidents first, short-circuiting the AI call entirely if operations have been normal for the last hour. History subcollections are auto-pruned to retain only the last 30 minutes.
- **Testing**: A full suite of 24 tests is implemented in Vitest (under `tests/`), testing input validation edge cases, anomaly threshold logic, classification fallbacks, sparkline path generation, history trimming, and announcement drafting logic.
- **Accessibility**: Built with semantic HTML elements (`header`, `nav`, `main`, `footer`, `section`, `article`). All buttons have descriptive `aria-label` fields detailing their exact action and location. Color choices (emerald, amber, rose) are paired with visible status text so meaning is never conveyed through color alone. Trend sparklines include an `aria-label` summarizing the trend in words (e.g. rising/falling/stable) to ensure screen-reader clarity. AI drafted announcements are wrapped in an `aria-live="polite"` container to automatically notify screen-reader users when new PA scripts are generated.

## Assumptions

Real IoT turnstiles, crowd-density CCTV feeds, and ticket scanners are not available in this evaluation environment. Therefore, crowd level data is simulated via a randomized simulator loop in the client to represent simulated live feeds and demonstrate how the AI reasoning layer responds to surges. In production, this would subscribe to actual physical APIs or event-bus webhooks from ticketing gates and ticketing APIs.

## Setup

1. Clone or download the repository files.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to a new file named `.env` in the root folder, and fill in your actual credentials for `VITE_GROQ_API_KEY` and the Firebase config variables.
4. Run `npm run dev` to start the local Vite development server.
5. Run `npm test` to run the Vitest automated test suite.
