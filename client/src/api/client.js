import axios from 'axios';

// Every request goes to /api on the web app's own address; the dev server and the
// production host forward it to the server, so the login cookie needs no cross-site setup.
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

let onSessionEnded = () => {};

// lets the app react when the server no longer accepts the login, on any request
export const setSessionEndedHandler = (handler) => {
  onSessionEnded = handler;
};

// a 401 from these is an answer to "who is logged in?" or to a login attempt, not an ended session
const isAuthCheck = (config) => ['/users/login', '/users/me', '/users/demo-login'].includes(config?.url);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthCheck(error.config)) {
      onSessionEnded();
    }
    return Promise.reject(error);
  }
);

// the message the server sent, or a general one when it could not be reached
export const errorMessage = (error) => {
  if (error.response) {
    return error.response.data?.message || 'Something went wrong on the server.';
  }

  if (error.request) {
    return 'Unable to reach the server. Please check your connection.';
  }

  return error.message || 'Something went wrong. Please try again.';
};

export const statusOf = (error) => error.response?.status || 0;

// every answer has the shape { statusCode, data, message, success }
export const unwrap = (response) => response.data;

export default api;
