import axiosInstance from '../../api/axiosInstance';

export const questionService = {
  // Fetch all questions for the company
  getQuestions: async () => {
    return await axiosInstance.get('/api/v1/questions');
  },

  // Create a new question (MCQ or Subjective)
  createQuestion: async (questionData) => {
    return await axiosInstance.post('/api/v1/questions', questionData);
  },

  // Update an existing question
  updateQuestion: async (id, questionData) => {
    return await axiosInstance.put(`/api/v1/questions/${id}`, questionData);
  },

  // Delete a question by ID
  deleteQuestion: async (id) => {
    return await axiosInstance.delete(`/api/v1/questions/${id}`);
  },
};

export default questionService;
