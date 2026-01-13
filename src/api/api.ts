import axios, { AxiosError } from 'axios';

let authToken: string | null = null;

const baseURL = 'http://85.31.63.50:1030';

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

// api.interceptors.request.use(
//   async (config) => {
//     try {
//     //   loadingManager.start();
//     } catch (e) {
//       console.log('Erro ao iniciar loadingManager:', e);
//     }

//     const tokenFromStorage = await AsyncStorage.getItem('@auth/token');
//     const token = tokenFromStorage ?? authToken;

//     if (token && config.url !== '/autenticacao/autenticar') {
//       config.headers = config.headers || {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     try {
//       loadingManager.stop();
//     } catch (e) {
//       console.log('Erro ao parar loadingManager (request error):', e);
//     }
//     return Promise.reject(error);
//   }
// );

// api.interceptors.response.use(
//   (response) => {
//     try {
//       loadingManager.stop();
//     } catch (e) {
//       console.log('Erro ao parar loadingManager (response success):', e);
//     }
//     return response;
//   },
//   (error: AxiosError) => {
//     try {
//       loadingManager.stop();
//     } catch (e) {
//       console.log('Erro ao parar loadingManager (response error):', e);
//     }

//     console.log('===== AXIOS RESPONSE ERROR =====');
//     console.log('message:', error.message);
//     console.log('code:', (error as any).code);
//     console.log('config.url:', error.config?.url);
//     console.log('config.method:', error.config?.method);
//     console.log('response?.status:', error.response?.status);
//     console.log('response?.data:', error.response?.data);

//     return Promise.reject(error);
//   }
// );