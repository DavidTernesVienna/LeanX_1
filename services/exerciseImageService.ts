const exerciseImageMap = new Map<string, string>([
  // Crawling Warmup
  ['pointers', 'https://i.imgur.com/8l1p2aJ.gif'],
  ['hip circles', 'https://i.imgur.com/uF0f2Y2.gif'],
  ['twist and reach', 'https://i.imgur.com/y3x3Y5e.gif'],
  ['crawling warm up', 'https://i.imgur.com/8l1p2aJ.gif'],
  // Side Lying Warmup
  ['backstroke', 'https://i.imgur.com/zW0c8d1.gif'],
  ['itb leg lifts', 'https://i.imgur.com/Yg5b9E6.gif'],
  ['side-lying leg lifts', 'https://i.imgur.com/Yg5b9E6.gif'],
  ['side lying warm up', 'https://i.imgur.com/zW0c8d1.gif'],
  // Pre-Warmup
  ['standing march', 'https://i.imgur.com/yT1b4Bw.gif'],
  ['jumping jacks', 'https://i.imgur.com/d5j6v6x.gif'],
  // Core
  ['parallel leg crunch', 'https://i.imgur.com/v0b8vYt.gif'],
  ['bent leg crunch', 'https://i.imgur.com/v0b8vYt.gif'], 
  ['starfish twist', 'https://i.imgur.com/1B3j2gS.gif'],
  ['straight leg crunch', 'https://i.imgur.com/P5tW7eN.gif'],
  ['starfish bounce', 'https://i.imgur.com/v8tq9hJ.gif'],
  // Glutes/Legs
  ['parallel leg bridge', 'https://i.imgur.com/zK3q4A8.gif'],
  ['bent leg bridge', 'https://i.imgur.com/zK3q4A8.gif'],
  ['straight leg bridge', 'https://i.imgur.com/i9bQ2kG.gif'],
  ['stork stance', 'https://i.imgur.com/L3c5n6N.gif'],
  ['bottom squat', 'https://i.imgur.com/yS4g1iW.gif'],
  ['low drop', 'https://i.imgur.com/yS4g1iW.gif'],
  ['high drop', 'https://i.imgur.com/yS4g1iW.gif'],
  ['double drop', 'https://i.imgur.com/yS4g1iW.gif'],
  ['kickout', 'https://i.imgur.com/2c7R8M1.gif'],
  ['streamline rdl', 'https://i.imgur.com/h5T2jF9.gif'],
  ['t-arm squat', 'https://i.imgur.com/a4g2Y3h.gif'],
  ['high kick', 'https://i.imgur.com/3q1g8wQ.gif'],
  ['starfish drop', 'https://i.imgur.com/v8tq9hJ.gif'],
  ['squat thrust', 'https://i.imgur.com/x9fJ8jW.gif'],
  ['drop thrust', 'https://i.imgur.com/x9fJ8jW.gif'],
  ['jump thrust', 'https://i.imgur.com/x9fJ8jW.gif'],
  ['side kick', 'https://i.imgur.com/n6t7p2L.gif'],
  ['rdl to squat', 'https://i.imgur.com/g0t6h2F.gif'],
  ['squat to rdl', 'https://i.imgur.com/g0t6h2F.gif'],
  ['side squat', 'https://i.imgur.com/o1f2jXy.gif'],
  ['let me ins', 'https://i.imgur.com/b5R4i7V.gif'],
  ['let me ups', 'https://i.imgur.com/d7T6eY3.gif'],
  ['tripod let me ups', 'https://i.imgur.com/d7T6eY3.gif'],
  ['tripod press', 'https://i.imgur.com/r6w7eJq.gif'],
  ['cossack squat', 'https://i.imgur.com/m4h8g2P.gif'],
  ['side to side cossack', 'https://i.imgur.com/m4h8g2P.gif'],
  ['dive bomber', 'https://i.imgur.com/f9e8jK3.gif'],
  ['alternating grip pull ups', 'https://i.imgur.com/j8n2o5G.gif'],
  ['streamline bulgarien split squats', 'https://i.imgur.com/s1f3g4H.gif'], 
  // Upper Body
  ['arm haulers', 'https://i.imgur.com/9n6b2YJ.gif'],
  ['y cuff', 'https://i.imgur.com/f3b8h2N.gif'],
  ['t-arm reach', 'https://i.imgur.com/d9j8v7K.gif'],
  // Cardio
  ['high-knee march', 'https://i.imgur.com/yT1b4Bw.gif'],
  ['high-knee run', 'https://i.imgur.com/p6c8g1L.gif'],
  ['high-knee skip', 'https://i.imgur.com/p6c8g1L.gif'],
  ['double fun glide', 'https://i.imgur.com/u7s8d2B.gif'],
  // Cool Down
  ['spiderman a-frames', 'https://i.imgur.com/s6t7p2M.gif'],
  ['spiderman arm circles', 'https://i.imgur.com/s6t7p2M.gif'],
  ['bloomers', 'https://i.imgur.com/k9v8c3F.gif'],
  ['straddle reach', 'https://i.imgur.com/t3g1h4J.gif'],
  ['iso pigeon stretch', 'https://i.imgur.com/n5t7p2M.gif'],
  ['hip rolls', 'https://i.imgur.com/zK3q4A8.gif'],
]);

const DEFAULT_IMAGE = 'https://i.imgur.com/6M3J4gG.gif';

export const getImageForExercise = (name: string): string => {
    return exerciseImageMap.get(name.toLowerCase().trim()) || DEFAULT_IMAGE;
};