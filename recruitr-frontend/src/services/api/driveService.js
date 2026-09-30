import axiosInstance from '../../api/axiosInstance';

export const driveService = {
  // Fetch all drives for the logged-in company admin
  getCompanyDrives: async () => {
    return await axiosInstance.get('/api/v1/drives');
  },

  // Create a new drive
  createDrive: async (driveData) => {
    return await axiosInstance.post('/api/v1/drives', driveData);
  },

  // Get drive details by ID
  getDriveById: async (id) => {
    return await axiosInstance.get(`/api/v1/drives/${id}`);
  },

  // Publish a draft drive
  publishDrive: async (id) => {
    return await axiosInstance.patch(`/api/v1/drives/${id}/publish`);
  },

  // Close an active drive
  closeDrive: async (id) => {
    return await axiosInstance.patch(`/api/v1/drives/${id}/close`);
  },

  // Delete a draft drive
  deleteDrive: async (id) => {
    return await axiosInstance.delete(`/api/v1/drives/${id}`);
  },

  // Add a round to a drive
  addRound: async (driveId, roundData) => {
    return await axiosInstance.post(`/api/v1/drives/${driveId}/rounds`, roundData);
  },

  // Get rounds for a drive
  getRoundsForDrive: async (driveId) => {
    return await axiosInstance.get(`/api/v1/drives/${driveId}/rounds`);
  },

  // Activate a specific round
  activateRound: async (driveId, roundId) => {
    return await axiosInstance.patch(`/api/v1/drives/${driveId}/rounds/${roundId}/activate`);
  },

  // Assign questions to a round
  assignQuestionsToRound: async (driveId, roundId, questionIds) => {
    return await axiosInstance.post(`/api/v1/drives/${driveId}/rounds/${roundId}/questions`, {
      questionIds,
    });
  },

  // Get questions assigned to a round
  getQuestionsForRound: async (driveId, roundId) => {
    return await axiosInstance.get(`/api/v1/drives/${driveId}/rounds/${roundId}/questions`);
  },
};

export default driveService;
