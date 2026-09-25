export type Sex = 'female' | 'male' | 'unspecified';
export type FitnessLevel = 'low' | 'medium' | 'high';
export type NightKind = 'rave' | 'club' | 'festival' | 'concert' | 'after';
export type PermissionChoice = 'granted' | 'denied' | 'skipped' | 'unavailable';
export type HeartRateOrigin = 'estimated' | 'measured' | 'none';
export type CalorieMethod = 'heart-rate' | 'motion';

export type Profile = {
  id: string;
  displayName: string;
  username: string;
  avatarColor: string;
  avatarUri?: string;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  sex: Sex | null;
  fitnessLevel: FitnessLevel;
  healthStatus: PermissionChoice;
  watchStatus: PermissionChoice;
  watchLabel: string | null;
  healthNote: string | null;
  watchNote: string | null;
  motionStatus: PermissionChoice;
  locationStatus: PermissionChoice;
  notificationStatus: PermissionChoice;
};

export type BodyProfile = {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  sex: Sex | null;
  fitnessLevel: FitnessLevel;
};

export type GeoPoint = { lat: number; lng: number; t: number };

export type ActivitySample = {
  t: number;
  ax: number;
  ay: number;
  az: number;
  lat?: number;
  lng?: number;
  heartRate?: number;
  steps?: number;
};

export type ActivitySummary = {
  id: string;
  userId: string;
  eventId: string | null;
  title: string;
  venue: string;
  startedAt: string;
  endedAt: string;
  activeSeconds: number;
  calories: number;
  calorieMethod: CalorieMethod;
  assumedWeight: boolean;
  jumps: number;
  distanceMeters: number;
  intensity: number;
  peakIntensity: number;
  peakOffsetSeconds: number;
  avgHeartRate: number | null;
  peakHeartRate: number | null;
  heartRateOrigin: HeartRateOrigin;
  musicBpm: number | null;
  nightKind: NightKind | null;
  partyScore: number;
  route: GeoPoint[];
  intensitySeries: number[];
  shared: boolean;
};

export type NightEvent = {
  id: string;
  title: string;
  venue: string;
  city: string;
  startsAt: string;
  musicBpm: number | null;
  attendeeIds: string[];
};

export type PublicUser = {
  id: string;
  displayName: string;
  username: string;
  avatarColor: string;
  avatarUri?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string | null;
};

export type AppSnapshot = {
  profile: Profile | null;
  users: PublicUser[];
  events: NightEvent[];
  activities: ActivitySummary[];
  notifications: AppNotification[];
};
