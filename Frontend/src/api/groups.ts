const API_BASE_URL = 'http://localhost:8000';

export interface GroupSummary {
  group: string;
}

export interface GroupWithMembers extends GroupSummary {
  device_macs: string[];
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
