const API_BASE_URL = 'http://localhost:8000';

export interface WhiteListEntry {
  words: string;
}

export interface WhiteListActionResponse {
  success?: boolean;
  message?: string;
  reason?: string;
}

const normalizeWhiteListEntry = (entry: any): WhiteListEntry | null => {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const words = (entry as any).words;
  if (typeof words !== 'string') {
    return null;
  }

  return { words };
};

export const fetchWhiteList = async (): Promise<WhiteListEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/white_list/get_white_list`);
  if (!response.ok) {
    throw new Error('Unable to load white list');
  }

  const json = await response.json();
  if (!Array.isArray(json)) {
    return [];
  }

  return json
    .map((entry) => normalizeWhiteListEntry(entry))
    .filter((entry): entry is WhiteListEntry => Boolean(entry));
};

export const addWhiteListWord = async (
  word: string
): Promise<WhiteListActionResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/white_list/add_words?words=${encodeURIComponent(word)}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Word could not be added (${response.status}): ${detail ?? ''}`
    );
  }

  const json = await response.json().catch(() => null);
  return (json ?? {}) as WhiteListActionResponse;
};

export const deleteWhiteListWord = async (
  word: string
): Promise<WhiteListActionResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/white_list/delete_words/${encodeURIComponent(word)}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Word could not be deleted (${response.status}): ${detail ?? ''}`
    );
  }

  const json = await response.json().catch(() => null);
  return (json ?? {}) as WhiteListActionResponse;
};

export const getWhiteListSocketUrl = (): string => {
  const wsBase = API_BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/white_list/ws/alerts`;
};
