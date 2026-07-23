export interface OrganizationSettings {
  workingDays: number[];
  defaultReportTime: string;
  defaultAiModel: string;
  emailSettings: {
    enabled: boolean;
    defaultRecipients: string[];
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  ownerId: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  workingDays: [1, 2, 3, 4, 5],
  defaultReportTime: '20:00',
  defaultAiModel: 'gemini-2.5-flash',
  emailSettings: {
    enabled: true,
    defaultRecipients: [],
  },
};
