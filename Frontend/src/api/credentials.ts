// Credential-related API helpers. Keeping them in a dedicated file avoids
// duplicating fetch logic across the UI.

const API_BASE_URL = 'http://localhost:8000';

export interface CredentialRecord {
  device_type: string;
  username: string;
  password: string;
  secret?: string;
  ip: string;
  snmp_password?: string;
}

export interface AddCredentialPayload {
  device_type: string;
  ip: string;
  username: string;
  password: string;
  secret?: string;
  snmp_password?: string;
}

export const fetchAllCredentials = async (): Promise<CredentialRecord[]> => {
  const response = await fetch(
    `${API_BASE_URL}/credentials/connection_details`
  );
  if (!response.ok) {
    throw new Error('Unable to load credentials');
  }

  const json = await response.json();
  if (!Array.isArray(json)) {
    return [];
  }

  return json as CredentialRecord[];
};

export const fetchCredentialByIp = async (
  ip: string
): Promise<CredentialRecord | null> => {
  const response = await fetch(
    `${API_BASE_URL}/credentials/get_one_cred?ip=${encodeURIComponent(ip)}`
  );

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  if (json && typeof json === 'object') {
    return json as CredentialRecord;
  }
  return null;
};

export const addCredential = async (
  payload: AddCredentialPayload
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/credentials/add_device`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Device could not be added (${response.status}): ${detail ?? ''}`
    );
  }
};
