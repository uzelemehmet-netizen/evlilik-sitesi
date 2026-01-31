
export enum MembershipTier {
  FREE = 'FREE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PREMIUM = 'PREMIUM'
}

export enum VerificationStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED'
}

export interface UserProfile {
  uid: string;
  username: string; // Diğer kullanıcıların göreceği isim
  name: string;     // Sistem doğrulaması için gerçek isim
  age: number;
  gender: 'MALE' | 'FEMALE';
  targetGender: 'MALE' | 'FEMALE';
  minTargetAge: number;
  maxTargetAge: number;
  country: 'Turkey' | 'Indonesia';
  city: string;
  nationality: string;
  incomeLevel: string;
  maritalStatus: string;
  hasChildren: boolean;
  numberOfChildren?: number;
  childrenStatus: string;
  relocationStatus: string;
  languages: string;
  willUseTranslation: boolean;
  partnerCanUseTranslation: boolean;
  intent: string;
  religiousLevel: string;
  education: string;
  occupation: string;
  smoker: boolean;
  wantKids: string;
  bio: string;
  photos: string[];
  photoPrivacy: 'PUBLIC' | 'PRIVATE';
  voiceIntro?: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  kycData?: {
    idCardUrl?: string;
    selfieUrl?: string;
    submittedAt?: number;
  };
  membershipTier: MembershipTier;
  isAdmin?: boolean;
  likedBy: string[];
  likes: string[];
  confirmedMatches: string[];
  profileAccessGranted: string[];
  dislikedUsers: string[];
  lastSeen: number;
  isOnline: boolean;
  phoneNumber: string;
  dailyMessageCount: number;
  profileUpdatedCount: number;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text?: string;
  audioUrl?: string; 
  translatedText?: string;
  timestamp: number;
  isSystem?: boolean;
}
