import axios from 'axios';

const API_URL = '/api';

const getProjectsCount = async () => {
  try {
    const token = localStorage.getItem('wku_cms_token');
    const response = await axios.get(`${API_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.length;
  } catch (error) {
    console.error('Error fetching projects count:', error);
    return 0;
  }
};

const getUsersCount = async () => {
  try {
    const token = localStorage.getItem('wku_cms_token');
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const users = response.data.data.users;
    const activeUsers = users.filter(user => user.isActive).length;
    return {
      total: users.length,
      active: activeUsers
    };
  } catch (error) {
    console.error('Error fetching users count:', error);
    return { total: 0, active: 0 };
  }
};

const getSchedulesCount = async () => {
  try {
    const token = localStorage.getItem('wku_cms_token');
    const response = await axios.get(`${API_URL}/schedules`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const schedules = response.data.schedules;
    const pendingSchedules = schedules.filter(schedule => schedule.status === 'pending').length;
    return {
      total: schedules.length,
      pending: pendingSchedules
    };
  } catch (error) {
    console.error('Error fetching schedules count:', error);
    return { total: 0, pending: 0 };
  }
};

export { getProjectsCount, getUsersCount, getSchedulesCount };
