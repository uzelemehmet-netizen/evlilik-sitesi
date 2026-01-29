import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const imageMap = new Map<string, ImagePlaceholder>(
  PlaceHolderImages.map(img => [img.id, img])
);

export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  isVerified: boolean;
  marriageIntent: 'Soon' | 'Eventually' | 'Not sure';
  profilePicture: ImagePlaceholder;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
}

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex',
    age: 28,
    bio: 'Software engineer with a love for hiking and dogs. Looking for a meaningful connection.',
    isVerified: true,
    marriageIntent: 'Eventually',
    profilePicture: imageMap.get('user-1')!,
  },
  {
    id: 'user-2',
    name: 'Ben',
    age: 32,
    bio: 'Artist and musician. My perfect date is a walk through a gallery followed by live music.',
    isVerified: true,
    marriageIntent: 'Soon',
    profilePicture: imageMap.get('user-2')!,
  },
  {
    id: 'user-3',
    name: 'Chloe',
    age: 27,
    bio: 'A foodie who loves to travel. Trying to find someone to explore new cuisines with.',
    isVerified: false,
    marriageIntent: 'Eventually',
    profilePicture: imageMap.get('user-3')!,
  },
  {
    id: 'user-4',
    name: 'David',
    age: 30,
    bio: 'Fitness enthusiast and personal trainer. Let\'s hit the gym together.',
    isVerified: true,
    marriageIntent: 'Not sure',
    profilePicture: imageMap.get('user-4')!,
  },
  {
    id: 'user-5',
    name: 'Emily',
    age: 29,
    bio: 'Bookworm and coffee addict. I love quiet nights in and deep conversations.',
    isVerified: true,
    marriageIntent: 'Soon',
    profilePicture: imageMap.get('user-5')!,
  },
    {
    id: 'user-6',
    name: 'Fiona',
    age: 26,
    bio: 'Veterinarian who enjoys horseback riding and volunteering at animal shelters.',
    isVerified: true,
    marriageIntent: 'Eventually',
    profilePicture: imageMap.get('user-6')!,
  },
  {
    id: 'user-7',
    name: 'George',
    age: 34,
    bio: 'Architect fascinated by history and old buildings. Big fan of road trips.',
    isVerified: false,
    marriageIntent: 'Soon',
    profilePicture: imageMap.get('user-7')!,
  },
  {
    id: 'user-8',
    name: 'Hannah',
    age: 31,
    bio: 'Yoga instructor and mindfulness coach. Seeking a partner who values spiritual growth.',
    isVerified: true,
    marriageIntent: 'Not sure',
    profilePicture: imageMap.get('user-8')!,
  },
    {
    id: 'user-9',
    name: 'Ian',
    age: 29,
    bio: 'Chef who loves experimenting with new recipes. Let me cook for you!',
    isVerified: false,
    marriageIntent: 'Eventually',
    profilePicture: imageMap.get('user-9')!,
  },
  {
    id: 'user-10',
    name: 'Jessica',
    age: 25,
    bio: 'Globetrotter and photographer. Looking for a travel buddy for my next adventure.',
    isVerified: true,
    marriageIntent: 'Not sure',
    profilePicture: imageMap.get('user-10')!,
  },
];

export const mockMessages: Message[] = [
    {
      id: 'msg-1',
      senderId: 'user-1',
      receiverId: 'user-2',
      text: 'Hey! I loved your profile, your art is amazing.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: 'msg-2',
      senderId: 'user-2',
      receiverId: 'user-1',
      text: 'Thanks! I appreciate that. You seem to have a great taste for adventure yourself.',
      timestamp: new Date(Date.now() - 1000 * 60 * 4),
    },
    {
      id: 'msg-3',
      senderId: 'user-1',
      receiverId: 'user-2',
      text: 'Totally! We should go hiking sometime.',
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
    },
];

export const getMatchById = (id: string) => mockUsers.find(u => u.id === id);
export const getCurrentUser = () => mockUsers.find(u => u.id === 'user-1');
