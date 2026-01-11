# Quiz Dashboard Summary (V1)

## appId

`quiz`

## Endpoint

Astro action: `actions.quiz.fetchDashboardSummary`

## Versioning

- `version` is required and must be `1` for this contract.
- Any breaking change must bump the version and ship a new schema.

## Response Shape (V1)

```json
{
  "version": 1,
  "appId": "quiz",
  "userId": 42,
  "updatedAt": "2026-01-11T10:42:18.231Z",
  "kpis": {
    "attemptsTotal": 37,
    "attemptsLast7d": 5,
    "avgScorePctAllTime": 71.4,
    "bestScorePctAllTime": 96.7,
    "lastAttemptAt": "2026-01-10T18:09:44.912Z"
  },
  "recentAttempts": [
    {
      "id": 981,
      "createdAt": "2026-01-10T18:09:44.912Z",
      "platformName": "Programming",
      "subjectName": "JavaScript",
      "topicName": "Arrays & Objects",
      "roadmapName": "JS Fundamentals",
      "level": "M",
      "score": { "mark": 29, "total": 30, "pct": 96.7 }
    },
    {
      "id": 972,
      "createdAt": "2026-01-09T21:34:11.403Z",
      "platformName": "Programming",
      "subjectName": "TypeScript",
      "topicName": "Types & Interfaces",
      "roadmapName": "TypeScript Basics",
      "level": "E",
      "score": { "mark": 17, "total": 20, "pct": 85.0 }
    },
    {
      "id": 964,
      "createdAt": "2026-01-08T19:02:57.118Z",
      "platformName": "General Knowledge",
      "subjectName": "Science",
      "topicName": "Physics",
      "roadmapName": "Basic Physics",
      "level": "M",
      "score": { "mark": 14, "total": 20, "pct": 70.0 }
    }
  ],
  "topRoadmaps": [
    {
      "roadmapId": 12,
      "roadmapName": "JS Fundamentals",
      "attempts": 11,
      "avgScorePct": 82.3
    },
    {
      "roadmapId": 19,
      "roadmapName": "TypeScript Basics",
      "attempts": 8,
      "avgScorePct": 76.5
    },
    {
      "roadmapId": 7,
      "roadmapName": "Basic Physics",
      "attempts": 6,
      "avgScorePct": 68.9
    }
  ]
}
```

## Notes

- Percentages are `0..100`, rounded to 1 decimal.
- Arrays may be empty when the user has no activity.
- `lastAttemptAt` can be `null`.
- `level` is `"E" | "M" | "D" | null`.
- Summary is user-scoped and must never leak cross-user data.
