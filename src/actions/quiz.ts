import { createPlatform, deletePlatform, fetchPlatforms, updatePlatform } from "./platform";
import { createQuestion, deleteQuestion, fetchQuestions, fetchRandomQuestions, updateQuestion } from "./question";
import { createRoadmap, deleteRoadmap, fetchRoadmaps, updateRoadmap } from "./roadmap";
import { saveResult } from "./result";
import { createSubject, deleteSubject, fetchSubjects, updateSubject } from "./subject";
import { createTopic, deleteTopic, fetchTopics, updateTopic } from "./topic";
import { fetchDashboardSummary } from "./dashboard";
import { listBookmarks, toggleBookmark } from "./bookmarks";

export const quiz = {
  fetchPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform,
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  fetchRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  fetchQuestions,
  fetchRandomQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  saveResult,
  fetchDashboardSummary,
  listBookmarks,
  toggleBookmark,
};

export {
  fetchPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform,
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  fetchRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  fetchQuestions,
  fetchRandomQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  saveResult,
  fetchDashboardSummary,
  listBookmarks,
  toggleBookmark,
};
