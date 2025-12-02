const API_BASE_URL = 'http://localhost:8000';

export interface GroupSummary {
  group: string;
}

export interface GroupWithMembers extends GroupSummary {
  device_macs: string[];
}

interface GroupActionResponse {
  success?: boolean;
  message?: string;
  reason?: string;
}

export const fetchAllGroups = async (): Promise<GroupSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/groups/get_all_groups`);
  if (!response.ok) {
    throw new Error('Unable to load groups');
  }

  const json = await response.json();
  if (!Array.isArray(json)) {
    return [];
  }

  return json as GroupSummary[];
};

export const fetchGroupWithMembers = async (
  groupName: string
): Promise<GroupWithMembers | null> => {
  const response = await fetch(
    `${API_BASE_URL}/groups/one_group?group_name=${encodeURIComponent(groupName)}`
  );

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  if (!json || typeof json !== 'object') {
    return null;
  }

  return {
    group: (json as any).group ?? groupName,
    device_macs: Array.isArray((json as any).device_macs)
      ? (json as any).device_macs
      : [],
  };
};

export const addGroup = async (payload: {
  group: string;
  device_macs?: string[];
}): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/groups/add_group`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Group could not be added (${response.status}): ${detail ?? ''}`
    );
  }
};

export const assignDeviceToGroup = async (
  deviceMac: string,
  groupName: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/groups/assign_device_to_group?device_mac=${encodeURIComponent(
      deviceMac
    )}&group_name=${encodeURIComponent(groupName)}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Device could not be assigned (${response.status}): ${detail ?? ''}`
    );
  }
};

export const deleteDeviceFromGroup = async (
  deviceMac: string,
  groupName: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/groups/delete_device_from_group?device_mac=${encodeURIComponent(
      deviceMac
    )}&group_name=${encodeURIComponent(groupName)}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Device could not be removed (${response.status}): ${detail ?? ''}`
    );
  }
};

// Placeholder for the upcoming endpoint; wired so the UI is ready once backend lands.
export const deleteGroup = async (groupName: string): Promise<GroupActionResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/groups/delete_group?group_name=${encodeURIComponent(
      groupName
    )}`,
    { method: 'PUT' }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Group could not be deleted (${response.status}): ${detail ?? ''}`
    );
  }

  const json = await response.json().catch(() => null);
  return (json ?? {}) as GroupActionResponse;
};
