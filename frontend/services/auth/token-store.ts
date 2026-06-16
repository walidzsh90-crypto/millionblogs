export type TokenStore = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
};

export function createMemoryTokenStore(): TokenStore {
  let accessToken: string | null = null;

  return {
    getAccessToken: () => accessToken,
    setAccessToken: (token) => {
      accessToken = token;
    },
    clear: () => {
      accessToken = null;
    }
  };
}

export const tokenStore = createMemoryTokenStore();
