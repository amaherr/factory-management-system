const parseBoolean = (value: string | undefined) => value?.toLowerCase() === 'true';

const cleanEnvValue = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const demoConfig = {
  isDemo: parseBoolean(import.meta.env.VITE_IS_DEMO),
  recruiterPhone: cleanEnvValue(import.meta.env.VITE_DEMO_PHONE),
  recruiterPin: cleanEnvValue(import.meta.env.VITE_DEMO_PIN),
};
