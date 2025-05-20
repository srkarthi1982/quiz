# 🎓 quiz.institute

**quiz.institute** is a dynamic, AI-powered learning platform built to help users master a wide range of subjects through structured quizzes, interactive roadmaps, and intelligent feedback. Whether you're preparing for competitive exams, learning new skills, or just curious — quiz.institute is your ultimate destination for smarter learning.

---

## 🚀 Features

- 🌐 **Multi-Disciplinary Coverage**  
  From Medical, Programming, and Business to Philosophy, Art, and Space Science — explore hundreds of topics across dozens of platforms.

- 🤖 **AI-Powered Question Generation**  
  Uses GPT-4o to generate fresh, relevant, and level-specific multiple-choice questions (MCQs) on demand.

- 📚 **Structured Learning Flow**  
  Navigate from platform → subject → topic → roadmap → difficulty → quiz, with seamless step-based transitions.

- 📈 **Progressive Difficulty Levels**  
  Each quiz is categorized as Easy (E), Medium (M), or Difficult (D), helping learners challenge themselves progressively.

- 💾 **Supabase-Powered Backend**  
  Leveraging Supabase for authentication, real-time storage, and Postgres querying, optimized with views and RLS.

- 💡 **Minimal UI with Alpine.js & Astro**  
  Built with Astro, TailwindCSS, and Alpine.js for lightning-fast performance and reactive, component-driven UX.

- 🔒 **Session Persistence**  
  Secure, refresh-proof login sessions using PKCE authentication and Supabase middleware.

---

## 🧠 How It Works

1. **User selects a platform** (e.g., "Medical" or "Programming")
2. **Subjects and topics** are revealed step by step
3. **Roadmaps** help contextualize learning (e.g., "Pre-Clinical" → "Anatomy")
4. **AI generates quizzes** for the selected topic and level
5. **User takes the quiz**, reviews answers with explanations, and can retry or explore more

---

## 🏗️ Tech Stack

| Layer            | Technology                          |
|------------------|--------------------------------------|
| Frontend         | Astro, Alpine.js, Tailwind CSS       |
| Backend (DB)     | Supabase (PostgreSQL, Auth)          |
| AI Integration   | OpenAI GPT-4o API (via streamed prompts) |
| Hosting & Domain | Vercel + custom domain               |

---

## 🌍 Platform Examples

| Platform                | Subjects                            |
|--------------------------|--------------------------------------|
| Medical                 | Nursing, Anatomy, Surgery           |
| Programming             | Web Dev, AI, Databases              |
| Business                | Marketing, Finance, Entrepreneurship|
| Civics & Governance     | Public Policy, Indian Constitution  |
| Culinary Arts           | Cooking Techniques, Nutrition       |

---

## 📦 Installation (for devs)

```bash
git clone https://github.com/yourusername/quiz.institute.git
cd quiz.institute
npm install
npm run dev 
