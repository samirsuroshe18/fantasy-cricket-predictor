import { createContext, useContext } from "react";

export const ApiCall = createContext({
  isApiCalled: false,
  setIsApiCalled: () => {}, // Placeholder for the setter function
});

export const ApiCallProvider = ApiCall.Provider;

export default function useApiCall() {
  return useContext(ApiCall);
}
