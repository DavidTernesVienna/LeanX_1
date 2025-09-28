import type { RawWorkout, Workout, Exercise } from './types';
import { parseTiming, assertWorkout } from './timing';

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const createExercise = (name: string): Exercise => ({
  name,
  image: `https://picsum.photos/seed/${slugify(name)}/400/400`,
  description: [
    'Maintain a straight back and engaged core.',
    'Focus on controlled, deliberate movements.',
    'Breathe steadily throughout the exercise.'
  ]
});

export const CRAWLING_WARMUP_NAMES = ["Pointers", "Hip Circles", "Twist and Reach"];
export const SIDELYING_WARMUP_NAMES = ["Backstroke", "ITB Leg Lifts", "Side-Lying Leg Lifts"];

const WORKOUT_NAMES: RawWorkout[] = [
    // Cycles 1,2,3,4
  { cycle: "Beginner", week: "Week 1", day: "Monday",    preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Crunch","Starfish Twist","Stork Stance"], coolDown: "Spiderman A-Frames" },
  { cycle: "Beginner", week: "Week 1", day: "Wednesday", preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Bridge","Starfish Twist","Stork Stance"], coolDown: "Spiderman A-Frames" },
  { cycle: "Beginner", week: "Week 1", day: "Friday",    preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Parallel Leg Crunch","Parallel Leg Bridge"], coolDown: "Spiderman A-Frames" },

  { cycle: "Beginner", week: "Week 2", day: "Monday",    preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Starfish Twist","Stork Stance"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Beginner", week: "Week 2", day: "Wednesday", preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Bridge","Starfish Twist","Bottom Squat"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Beginner", week: "Week 2", day: "Friday",    preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Stork Stance","Low Drop"], coolDown: "Spiderman Arm Circles" },

  { cycle: "Beginner", week: "Week 3", day: "Monday",    preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Crunch","Starfish Twist","High-Knee March"], coolDown: "Bloomers" },
  { cycle: "Beginner", week: "Week 3", day: "Wednesday", preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Bridge","Low Drop","High-Knee March"], coolDown: "Bloomers" },
  { cycle: "Beginner", week: "Week 3", day: "Friday",    preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Bottom Squat","Kickout"], coolDown: "Bloomers" },

  { cycle: "Beginner", week: "Week 4", day: "Monday",    preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Crunch","Parallel Leg Bridge","Arm Haulers"], coolDown: "Straddle Reach" },
  { cycle: "Beginner", week: "Week 4", day: "Wednesday", preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Bridge","Starfish Twist","Bottom Squat"], coolDown: "Straddle Reach" },
  { cycle: "Beginner", week: "Week 4", day: "Friday",    preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Low Drop","Streamline RDL"], coolDown: "Straddle Reach" },

  { cycle: "Beginner", week: "Week 5", day: "Monday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Crunch","Kickout","High-Knee March"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Beginner", week: "Week 5", day: "Wednesday", preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Bridge","Parallel Leg Crunch","Y Cuff"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Beginner", week: "Week 5", day: "Friday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Starfish Twist","T-arm Squat"], coolDown: "Iso Pigeon Stretch" },

  { cycle: "Beginner", week: "Week 6", day: "Monday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Crunch","Kickout","Bottom Squat"], coolDown: "Hip Rolls" },
  { cycle: "Beginner", week: "Week 6", day: "Wednesday", preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Bridge","Streamline RDL","High Kick"], coolDown: "Hip Rolls" },
  { cycle: "Beginner", week: "Week 6", day: "Friday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Y Cuff","T-arm Squat","Bent Leg Crunch"], coolDown: "Hip Rolls" },

  { cycle: "Intermediate", week: "Week 1", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Side Lying Warm Up", exercises: ["Arm Haulers","Starfish Twist","Stork Stance"], coolDown: "Spiderman A-Frames" },
  { cycle: "Intermediate", week: "Week 1", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Side Lying Warm Up", exercises: ["Bent Leg Bridge","Bottom Squat","High Drop"], coolDown: "Spiderman A-Frames" },
  { cycle: "Intermediate", week: "Week 1", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Side Lying Warm Up", exercises: ["Y Cuff","High Kick","High-Knee Run"], coolDown: "Spiderman A-Frames" },
  { cycle: "Intermediate", week: "Week 1", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Side Lying Warm Up", exercises: ["Parallel Leg Bridge","High Drop","T-arm Squat"], coolDown: "Spiderman A-Frames" },

  { cycle: "Intermediate", week: "Week 2", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Bridge","High-Knee March","Starfish Drop"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Intermediate", week: "Week 2", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Y Cuff","High Kick","Squat Thrust"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Intermediate", week: "Week 2", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Crunch","Stork Stance","Side Kick"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Intermediate", week: "Week 2", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Low Drop","Streamline RDL"], coolDown: "Spiderman Arm Circles" },

  { cycle: "Intermediate", week: "Week 3", day: "Monday",    preWarmUp: "Standing March", timing: "45/15", warmUp: "Side Lying Warm Up", exercises: ["T-arm Reach","Starfish Drop","High-Knee Run"], coolDown: "Bloomers" },
  { cycle: "Intermediate", week: "Week 3", day: "Tuesday",   preWarmUp: "Standing March", timing: "45/15", warmUp: "Side Lying Warm Up", exercises: ["Bent Leg Crunch","Kickout","Squat Thrust"], coolDown: "Bloomers" },
  { cycle: "Intermediate", week: "Week 3", day: "Thursday",  preWarmUp: "Standing March", timing: "45/15", warmUp: "Side Lying Warm Up", exercises: ["Bent Leg Bridge","Streamline RDL","Double Fun Glide"], coolDown: "Bloomers" },
  { cycle: "Intermediate", week: "Week 3", day: "Friday",    preWarmUp: "Standing March", timing: "45/15", warmUp: "Side Lying Warm Up", exercises: ["T-arm Reach","High Drop","T-arm Squat"], coolDown: "Bloomers" },

  { cycle: "Intermediate", week: "Week 4", day: "Monday",    preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Crunch","Side Kick","High-Knee Skip"], coolDown: "Straddle Reach" },
  { cycle: "Intermediate", week: "Week 4", day: "Tuesday",   preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Bridge","Low Drop","Bottom Squat"], coolDown: "Straddle Reach" },
  { cycle: "Intermediate", week: "Week 4", day: "Thursday",  preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Y Cuff","Starfish Drop","RDL to Squat"], coolDown: "Straddle Reach" },
  { cycle: "Intermediate", week: "Week 4", day: "Friday",    preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Side Kick","Stork Stance"], coolDown: "Straddle Reach" },

  { cycle: "Intermediate", week: "Week 5", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Parallel Leg Bridge","Kickout","Side Squat"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Intermediate", week: "Week 5", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["T-arm Reach","High Kick","Squat Thrust"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Intermediate", week: "Week 5", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Bent Leg Crunch","Double Fun Glide","High-Knee Skip"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Intermediate", week: "Week 5", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Y Cuff","Side Squat","Double Drop"], coolDown: "Iso Pigeon Stretch" },

  { cycle: "Intermediate", week: "Week 6", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Side Kick","Drop Thrust"], coolDown: "Hip Rolls" },
  { cycle: "Intermediate", week: "Week 6", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Crunch","Starfish Twist","RDL to Squat"], coolDown: "Hip Rolls" },
  { cycle: "Intermediate", week: "Week 6", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Straight Leg Bridge","Double Drop","Side Squat"], coolDown: "Hip Rolls" },
  { cycle: "Intermediate", week: "Week 6", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["T-arm Reach","Kickout","Drop Thrust"], coolDown: "Hip Rolls" },

  { cycle: "Advanced", week: "Week 1", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Side Lying Warm Up", exercises: ["Double Fun Glide","Let Me Ins","RDL to Squat"], coolDown: "Spiderman A-Frames" },
  { cycle: "Advanced", week: "Week 1", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Straight Leg Bridge","Side Kick","Stork Stance"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Advanced", week: "Week 1", day: "Wednesday", preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Straight Leg Crunch","Starfish Drop","T-arm Squat"], coolDown: "Bloomers" },
  { cycle: "Advanced", week: "Week 1", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["T-arm Reach","Kickout","Side Squat"], coolDown: "Straddle Reach" },
  { cycle: "Advanced", week: "Week 1", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Side Lying Warm Up", exercises: ["Low Drop","Drop Thrust","Let Me Ups"], coolDown: "Iso Pigeon Stretch" },

  { cycle: "Advanced", week: "Week 2", day: "Monday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Crunch","High Kick","Squat Thrust"], coolDown: "Hip Rolls" },
  { cycle: "Advanced", week: "Week 2", day: "Tuesday",   preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Straight Leg Bridge","T-arm Reach","Stork Stance"], coolDown: "Spiderman A-Frames" },
  { cycle: "Advanced", week: "Week 2", day: "Wednesday", preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up", exercises: ["Double Fun Glide","Let Me Ins","Squat to RDL"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Advanced", week: "Week 2", day: "Thursday",  preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Arm Haulers","Double Drop","Parallel Leg Bridge"], coolDown: "Bloomers" },
  { cycle: "Advanced", week: "Week 2", day: "Friday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Y Cuff","Starfish Twist","Cossack Squat"], coolDown: "Straddle Reach" },

  { cycle: "Advanced", week: "Week 3", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "45/15", warmUp: "Side Lying Warm Up", exercises: ["Starfish Bounce","Let Me Ups","Squat to RDL"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Advanced", week: "Week 3", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Bent Leg Bridge","Stork Stance","High-Knee Run"], coolDown: "Hip Rolls" },
  { cycle: "Advanced", week: "Week 3", day: "Wednesday", preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Arm Haulers","High Kick","RDL to Squat"], coolDown: "Spiderman A-Frames" },
  { cycle: "Advanced", week: "Week 3", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Straight Leg Crunch","Double Drop","High-Knee Skip"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Advanced", week: "Week 3", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "45/15", warmUp: "Side Lying Warm Up", exercises: ["Tripod Press","Let Me Ins","Cossack Squat"], coolDown: "Bloomers" },

  { cycle: "Advanced", week: "Week 4", day: "Monday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Straight Leg Bridge","Side Kick","Squat Thrust"], coolDown: "Straddle Reach" },
  { cycle: "Advanced", week: "Week 4", day: "Tuesday",   preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Bent Leg Crunch","High Drop","Stork Stance"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Advanced", week: "Week 4", day: "Wednesday", preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up", exercises: ["Double Fun Glide","Squat to RDL","Tripod Let Me Ups"], coolDown: "Hip Rolls" },
  { cycle: "Advanced", week: "Week 4", day: "Thursday",  preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Y Cuff","Low Drop","Bottom Squat"], coolDown: "Spiderman A-Frames" },
  { cycle: "Advanced", week: "Week 4", day: "Friday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Bridge","T-arm Reach","Cossack Squat"], coolDown: "Spiderman Arm Circles" },

  { cycle: "Advanced", week: "Week 5", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Starfish Bounce","Let Me Ins","Jump Thrust"], coolDown: "Bloomers" },
  { cycle: "Advanced", week: "Week 5", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["T-arm Reach","Straight Leg Bridge","RDL to Squat"], coolDown: "Straddle Reach" },
  { cycle: "Advanced", week: "Week 5", day: "Wednesday", preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Y Cuff","High-Knee Skip","Dive Bomber"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Advanced", week: "Week 5", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Straight Leg Crunch","Straight Leg Bridge","Jump Thrust"], coolDown: "Hip Rolls" },
  { cycle: "Advanced", week: "Week 5", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Side Lying Warm Up", exercises: ["Hight Drop","Tripod Let Me Ups","Side to Side Cossack"], coolDown: "Spiderman A-Frames" },

  { cycle: "Advanced", week: "Week 6", day: "Monday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Dive Bomber","Straight Leg Crunch","Jump Thrust"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Advanced", week: "Week 6", day: "Tuesday",   preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Parallel Leg Bridge","High Kick","High-Knee Skip"], coolDown: "Bloomers" },
  { cycle: "Advanced", week: "Week 6", day: "Wednesday", preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Tripod Press","Let Me Ins","Side to Side Cossack"], coolDown: "Straddle Reach" },
  { cycle: "Advanced", week: "Week 6", day: "Thursday",  preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["T-arm Reach","Double Drop","Squat to RDL"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Advanced", week: "Week 6", day: "Friday",    preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up", exercises: ["Y Cuff","Low Drop","Squat Thrust"], coolDown: "Hip Rolls" },

  { cycle: "Expert", week: "Week 1", day: "Monday",    preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Starfish Drop","Let Me Ups","T-arm Squat"], coolDown: "Spiderman A-Frames" },
  { cycle: "Expert", week: "Week 1", day: "Tuesday",   preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up",  exercises: ["Straight Leg Bridge","High Kick","Stork Stance"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Expert", week: "Week 1", day: "Wednesday", preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Double Drop","Alternating Grip Pull Ups","Side to Side Cossack"], coolDown: "Bloomers" },
  { cycle: "Expert", week: "Week 1", day: "Thursday",  preWarmUp: "Standing March", timing: "40/20", warmUp: "Crawling Warm Up",  exercises: ["Bent Leg Bridge","Arm Haulers","High-Knee March"], coolDown: "Straddle Reach" },
  { cycle: "Expert", week: "Week 1", day: "Friday",    preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Dive Bomber","Let Me Ins","T-arm Squat"], coolDown: "Iso Pigeon Stretch" },

  { cycle: "Expert", week: "Week 2", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Crawling Warm Up",  exercises: ["Straight Leg Crunch","Starfish Twist","High-Knee Run"], coolDown: "Hip Rolls" },
  { cycle: "Expert", week: "Week 2", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Side Lying Warm Up", exercises: ["Dive Bomber","Alternating Grip Pull Ups","Streamline Bulgarien SS"], coolDown: "Spiderman A-Frames" },
  { cycle: "Expert", week: "Week 2", day: "Wednesday", preWarmUp: "Jumping Jacks", timing: "60/0",  warmUp: "Crawling Warm Up",  exercises: ["Bent Leg Bridge","Low Drop","High-Knee Skip"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Expert", week: "Week 2", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Double Fun Glide","Tripod Let Me Ups","Streamline RDL"], coolDown: "Bloomers" },
  { cycle: "Expert", week: "Week 2", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "40/20", warmUp: "Crawling Warm Up",  exercises: ["T-arm Reach","Straight Leg Bridge","Parallel Leg Crunch"], coolDown: "Straddle Reach" },

  { cycle: "Expert", week: "Week 3", day: "Monday",    preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Tripod Press","Let Me Ins","RDL to Squat"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Expert", week: "Week 3", day: "Tuesday",   preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up",  exercises: ["Bent Leg Bridge","High Drop","Side Squat"], coolDown: "Hip Rolls" },
  { cycle: "Expert", week: "Week 3", day: "Wednesday", preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Side Kick","Alternating Grip Pull Ups","Streamline Bulgarien SS"], coolDown: "Spiderman A-Frames" },
  { cycle: "Expert", week: "Week 3", day: "Thursday",  preWarmUp: "Standing March", timing: "45/15", warmUp: "Crawling Warm Up",  exercises: ["Low Drop","High-Knee March","Stork Stance"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Expert", week: "Week 3", day: "Friday",    preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Double Fun Glide","Let Me Ups","Bottom Squat"], coolDown: "Bloomers" },

  { cycle: "Expert", week: "Week 4", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "45/15", warmUp: "Crawling Warm Up",  exercises: ["T-arm Reach","Kickout","High-Knee Skip"], coolDown: "Straddle Reach" },
  { cycle: "Expert", week: "Week 4", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Tripod Press","Tripod Let Me Ups","Side to Side Cossack"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Expert", week: "Week 4", day: "Wednesday", preWarmUp: "Jumping Jacks", timing: "45/15", warmUp: "Crawling Warm Up",  exercises: ["Parallel Leg Crunch","High-Knee March","Streamline RDL"], coolDown: "Hip Rolls" },
  { cycle: "Expert", week: "Week 4", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "60/0",  warmUp: "Crawling Warm Up",  exercises: ["Double Fun Glide","Alternating Grip Pull Ups","Squat to RDL"], coolDown: "Spiderman A-Frames" },
  { cycle: "Expert", week: "Week 4", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "45/15", warmUp: "Crawling Warm Up",  exercises: ["Double Drop","High-Knee Run","Jump Thrust"], coolDown: "Spiderman Arm Circles" },

  { cycle: "Expert", week: "Week 5", day: "Monday",    preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Starfish Bounce","Tripod Let Me Ups","Side Squat"], coolDown: "Bloomers" },
  { cycle: "Expert", week: "Week 5", day: "Tuesday",   preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up",  exercises: ["Bent Leg Crunch","Side Kick","RDL to Squat"], coolDown: "Straddle Reach" },
  { cycle: "Expert", week: "Week 5", day: "Wednesday", preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Dive Bomber","Alternating Grip Pull Ups","Streamline Bulgarien SS"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Expert", week: "Week 5", day: "Thursday",  preWarmUp: "Standing March", timing: "50/10", warmUp: "Crawling Warm Up",  exercises: ["Straight Leg Crunch","High-Knee Skip","Drop Thrust"], coolDown: "Hip Rolls" },
  { cycle: "Expert", week: "Week 5", day: "Friday",    preWarmUp: "Standing March", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Tripod Press","Let Me Ins","Side to Side Cossack"], coolDown: "Spiderman A-Frames" },

  { cycle: "Expert", week: "Week 6", day: "Monday",    preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Crawling Warm Up",  exercises: ["Y Cuff","Bent Leg Crunch","T-arm Squat"], coolDown: "Spiderman Arm Circles" },
  { cycle: "Expert", week: "Week 6", day: "Tuesday",   preWarmUp: "Jumping Jacks", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Tripod Press","Alternating Grip Pull Ups","Stork Stance"], coolDown: "Bloomers" },
  { cycle: "Expert", week: "Week 6", day: "Wednesday", preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Crawling Warm Up",  exercises: ["T-arm Reach","High-Knee Skip","RDL to Squat"], coolDown: "Straddle Reach" },
  { cycle: "Expert", week: "Week 6", day: "Thursday",  preWarmUp: "Jumping Jacks", timing: "60/0",  warmUp: "Side Lying Warm Up", exercises: ["Double Fun Glide","Let Me Ups","Streamline RDL"], coolDown: "Iso Pigeon Stretch" },
  { cycle: "Expert", week: "Week 6", day: "Friday",    preWarmUp: "Jumping Jacks", timing: "50/10", warmUp: "Crawling Warm Up",  exercises: ["Arm Haulers","Side Kick","Squat to RDL"], coolDown: "Hip Rolls" },
];

export const BUILT_IN_DATA: Workout[] = WORKOUT_NAMES.map((w) => {
    const { work, rest, rounds } = parseTiming(w.timing, w.rounds);
    const id = `${w.cycle}|${w.week}|${w.day}|${w.timing}`.toLowerCase();

    // Omit the optional 'rounds' from the raw workout object before spreading
    const { rounds: _rawRounds, ...rawWorkoutRest } = w;

    return {
        ...rawWorkoutRest,
        id,
        work,
        rest,
        rounds,
        preWarmUp: createExercise(w.preWarmUp),
        warmUp: createExercise(w.warmUp),
        warmUpExercises: (w.warmUp === 'Crawling Warm Up' ? CRAWLING_WARMUP_NAMES : SIDELYING_WARMUP_NAMES).map(createExercise),
        exercises: w.exercises.map(createExercise),
        coolDown: createExercise(w.coolDown),
    };
}).filter(assertWorkout);