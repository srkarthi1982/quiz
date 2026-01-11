import type { QuizDashboardSummaryV1 } from "../../dashboard/summary.schema";

export type QuizSummaryProps = {
  summary: QuizDashboardSummaryV1;
};

const formatPct = (value: number) => `${value.toFixed(1)}%`;

const formatDateTime = (value: string | null) => {
  if (!value) return "No attempts yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No attempts yet" : date.toLocaleString();
};

export const QuizSummary = ({ summary }: QuizSummaryProps) => {
  const { kpis, recentAttempts, topRoadmaps } = summary;

  return (
    <section className="av-auth-stack-lg">
      <div className="av-form-row">
        <div className="av-auth-stack-xxs">
          <div className="av-kicker">
            <span>Quiz</span>
          </div>
          <h2 className="av-card-heading">Quiz summary</h2>
          <p className="av-text-soft">Last attempt: {formatDateTime(kpis.lastAttemptAt)}</p>
        </div>
        <div className="av-row-wrap">
          <a className="av-btn av-btn-primary av-btn-sm" href="/quiz">
            Open Quiz
          </a>
          <a className="av-btn av-btn-ghost av-btn-sm" href="/results">
            View Results
          </a>
        </div>
      </div>

      <div className="av-grid-auto av-grid-auto--260">
        <div className="av-card av-card-soft av-card--fullheight">
          <div className="av-auth-stack-xxs">
            <p className="av-card-heading">Attempts</p>
            <h3 className="av-app-card-title">{kpis.attemptsTotal}</h3>
            <p className="av-text-soft">All time</p>
          </div>
        </div>
        <div className="av-card av-card-soft av-card--fullheight">
          <div className="av-auth-stack-xxs">
            <p className="av-card-heading">Attempts (7d)</p>
            <h3 className="av-app-card-title">{kpis.attemptsLast7d}</h3>
            <p className="av-text-soft">Last 7 days</p>
          </div>
        </div>
        <div className="av-card av-card-soft av-card--fullheight">
          <div className="av-auth-stack-xxs">
            <p className="av-card-heading">Avg Score</p>
            <h3 className="av-app-card-title">{formatPct(kpis.avgScorePctAllTime)}</h3>
            <p className="av-text-soft">All attempts</p>
          </div>
        </div>
        <div className="av-card av-card-soft av-card--fullheight">
          <div className="av-auth-stack-xxs">
            <p className="av-card-heading">Best Score</p>
            <h3 className="av-app-card-title">{formatPct(kpis.bestScorePctAllTime)}</h3>
            <p className="av-text-soft">All time best</p>
          </div>
        </div>
      </div>

      <div className="av-section-grid av-section-grid--2">
        <div className="av-card">
          <div className="av-auth-stack-md">
            <div className="av-form-row">
              <div>
                <h3 className="av-card-heading">Recent attempts</h3>
                <p className="av-text-soft">Last 5</p>
              </div>
            </div>
            {recentAttempts.length === 0 ? (
              <p className="av-text-soft">No attempts yet.</p>
            ) : (
              <ul className="av-list">
                {recentAttempts.map((attempt) => (
                  <li key={attempt.id} className="av-form-row">
                    <div className="av-auth-stack-xxs">
                      <strong>
                        {attempt.platformName} / {attempt.subjectName} / {attempt.topicName}
                      </strong>
                      <p className="av-text-soft">
                        {attempt.roadmapName} / {new Date(attempt.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="av-badge av-badge-soft">
                      {attempt.score.mark}/{attempt.score.total} ({formatPct(attempt.score.pct)})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="av-card">
          <div className="av-auth-stack-md">
            <div className="av-form-row">
              <div>
                <h3 className="av-card-heading">Top roadmaps</h3>
                <p className="av-text-soft">All time</p>
              </div>
            </div>
            {topRoadmaps.length === 0 ? (
              <p className="av-text-soft">No roadmap activity yet.</p>
            ) : (
              <ul className="av-list">
                {topRoadmaps.map((roadmap) => (
                  <li key={roadmap.roadmapId} className="av-form-row">
                    <div className="av-auth-stack-xxs">
                      <strong>{roadmap.roadmapName}</strong>
                      <p className="av-text-soft">{roadmap.attempts} attempts</p>
                    </div>
                    <span className="av-badge av-badge-soft">{formatPct(roadmap.avgScorePct)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
