const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

export const getApiBaseUrl = () => {
  const configuredUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const normalized = trimTrailingSlash(configuredUrl);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

export const getApiOriginUrl = () => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/\/api\/?$/, '');
};
