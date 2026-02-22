import { Faq, db, eq } from "astro:db";

type FaqItem = { category: string; question: string; answer: string };

const FAQS: FaqItem[] = [
  {
    category: "Getting Started",
    question: "How do I create a quiz?",
    answer:
      "In the current Quiz app, quizzes are created and managed by administrators. Learners can select available platforms and topics, then start quizzes from the app home flow.",
  },
  {
    category: "Quiz Management",
    question: "Can I edit a quiz after publishing?",
    answer:
      "Quiz content updates are handled by authorized admins. Learner-side sessions always use the latest published question set available in the app.",
  },
  {
    category: "Scoring",
    question: "How does scoring work?",
    answer:
      "Your score is calculated from your submitted answers in the quiz session. Results include your performance summary after completion.",
  },
  {
    category: "Sharing",
    question: "Can I share quizzes with others?",
    answer:
      "There is no separate public share link for individual quizzes in the learner flow. You can share access to the Quiz app, and users can attempt available quizzes after sign-in.",
  },
  {
    category: "Results",
    question: "Are quiz results saved?",
    answer:
      "Yes. Your quiz outcomes are stored so you can review your progress and past performance from the results experience.",
  },
];

export default async function seedFaqContent() {
  await db.delete(Faq).where(eq(Faq.audience, "user"));

  await db.insert(Faq).values(
    FAQS.map((item, index) => ({
      audience: "user",
      category: item.category,
      question: item.question,
      answer_md: item.answer,
      sort_order: index + 1,
      is_published: true,
      created_at: new Date(),
      updated_at: new Date(),
    }))
  );

  console.log(`Seeded ${FAQS.length} production FAQs for quiz user audience.`);
}
