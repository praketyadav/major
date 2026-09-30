import axiosInstance from '../../api/axiosInstance';

export const resultsService = {
  // Get all candidate results for a specific round
  getResultsForRound: async (roundId) => {
    return await axiosInstance.get(`/api/v1/results/round/${roundId}`);
  },

  // Submit subjective review & score marks for candidate
  submitSubjectiveReview: async (resultId, data) => {
    return await axiosInstance.post(`/api/v1/results/${resultId}/subjective-review`, data);
  },

  // Advance students who met cutoff to the next round / finalize
  advanceStudents: async (roundId, data = {}) => {
    return await axiosInstance.post(`/api/v1/results/round/${roundId}/advance`, data);
  },

  // Release result key / answer key for a round
  releaseResultKey: async (roundId) => {
    return await axiosInstance.post(`/api/v1/results/round/${roundId}/release-key`);
  },

  // Get specific student result
  getStudentResult: async (studentId, roundId) => {
    return await axiosInstance.get(`/api/v1/results/student/${studentId}/round/${roundId}`);
  },
};

export default resultsService;
