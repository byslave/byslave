export const covers = {
  crowd: require('../../assets/images/demo/crowd.jpg'),
  lights: require('../../assets/images/demo/lights.jpg'),
  concert: require('../../assets/images/demo/concert.jpg'),
} as const;

export const portraits = {
  p1: require('../../assets/images/demo/p1.jpg'),
  p2: require('../../assets/images/demo/p2.jpg'),
  p3: require('../../assets/images/demo/p3.jpg'),
  p4: require('../../assets/images/demo/p4.jpg'),
} as const;

export type CoverKey = keyof typeof covers;
export type PortraitKey = keyof typeof portraits;
