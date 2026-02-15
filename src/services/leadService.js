import axios from "axios";

export const insertSearchParams = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/insertsearchparams`,
        data,
      );
      resolve(response.data);
    } catch (error) {
      reject(error);
    }
  });
};

export const getSearchParamById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/searchparambyid/${id}`,
      );
      resolve(response.data);
    } catch (error) {
      reject(error);
    }
  });
};

export const getDashboardStats = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard-stats`,
      );
      resolve(response.data);
    } catch (error) {
      reject(error);
    }
  });
};

export const getSearchParams = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/getsearchparams`,
      );
      resolve(response.data);
    } catch (error) {
      reject(error);
    }
  });
};
export const insertChatHistory = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/insertchathistory`,
        data,
      );
      resolve(response.data);
    } catch (error) {
      reject(error);
    }
  });
};
