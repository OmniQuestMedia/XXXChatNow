export interface IAggregatorCams {
    service: string;

  servicePerformerId: string;

  gender: string;

  avatar: string;

  username: string;

  dateOfBirth: Date;

  age: number;

  isOnline: boolean;

  watching: number;

  stats: {
    views: number;
    favorites: number;
  };

  streamingStatus: string;

  country: string;

  city: string;

  languages: string[];

  aboutMe: string;

  tags: string;

  iframe: string;

  profileLink: string

  createdAt: Date;

  updatedAt: Date;
  }
