import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from './gameContext';
import StorySessionManager from './StorySessionManager';
import { BookOpen, Users, Settings, ArrowRight } from 'lucide-react-native';
import SettingsScreen from './SettingsScreen';

const { width } = Dimensions.get('window');

// Story Worlds with Multiple Playable Characters
const STORY_WORLDS = [
  {
    id: 'sherlock_world',
    title: 'The World of Sherlock Holmes',
    description: 'Victorian London mysteries and detective work',
    author: 'Arthur Conan Doyle',
    setting: 'Victorian London',
    genre: 'Mystery',
    characters: [
      {
        id: 'sherlock_holmes',
        name: 'Sherlock Holmes',
        role: 'The Great Detective',
        difficulty: 'Medium',
        description: 'Use your powers of deduction to solve mysteries.',
        traits: ['analytical', 'observant', 'logical', 'eccentric', 'brilliant'],
        worldview: 'Everything can be deduced through careful observation and logical reasoning',
        background: 'World-renowned consulting detective living at 221B Baker Street',
        speech_style: 'Articulate, precise, sometimes condescending, uses deductive explanations',
        motivations: ['solving mysteries', 'intellectual challenges', 'justice'],
        relationships: ['Dr. Watson (loyal friend)', 'Mrs. Hudson (landlady)', 'Inspector Lestrade (police contact)'],
        canonical_knowledge: 'Arthur Conan Doyle stories - deductive reasoning, crime solving, Victorian atmosphere'
      },
      {
        id: 'dr_watson',
        name: 'Dr. John Watson',
        role: 'The Loyal Companion',
        difficulty: 'Easy',
        description: 'Support Holmes while developing your own detective skills.',
        traits: ['loyal', 'practical', 'brave', 'medical', 'steadfast'],
        worldview: 'Justice and friendship matter most; loyalty and duty guide all actions',
        background: 'Military doctor and medical practitioner, Holmes\' closest friend and chronicler',
        speech_style: 'Straightforward, medical terminology, loyal admiration for Holmes',
        motivations: ['supporting Holmes', 'helping others', 'medical duty'],
        relationships: ['Sherlock Holmes (best friend)', 'Mrs. Hudson (landlady)', 'Mary Morstan (wife)'],
        canonical_knowledge: 'Arthur Conan Doyle stories - medical knowledge, military background, loyal friendship'
      },
      {
        id: 'inspector_lestrade',
        name: 'Inspector Lestrade',
        role: 'Scotland Yard Detective',
        difficulty: 'Medium',
        description: 'Solve crimes with official police authority and street smarts.',
        traits: ['determined', 'pragmatic', 'stubborn', 'official', 'experienced'],
        worldview: 'Law and order must be maintained; official channels and hard work solve crimes',
        background: 'Senior Scotland Yard inspector who often consults with Holmes',
        speech_style: 'Official police terminology, practical, sometimes frustrated',
        motivations: ['upholding law', 'solving cases', 'police duty'],
        relationships: ['Sherlock Holmes (consultant)', 'Dr. Watson (ally)', 'Scotland Yard colleagues'],
        canonical_knowledge: 'Arthur Conan Doyle stories - police procedures, official investigation methods'
      }
    ]
  },
  {
    id: 'dracula_world',
    title: 'The World of Dracula',
    description: 'Gothic horror in Transylvania and Victorian England',
    author: 'Bram Stoker',
    setting: 'Transylvania & Victorian England',
    genre: 'Gothic Horror',
    characters: [
      {
        id: 'dracula',
        name: 'Count Dracula',
        role: 'The Vampire Lord',
        difficulty: 'Hard',
        description: 'Command the night as the legendary vampire count.',
        traits: ['manipulative', 'ancient', 'aristocratic', 'predatory', 'charismatic'],
        worldview: 'Mortals exist to serve immortal beings; power and survival above all',
        background: 'Ancient vampire lord, centuries old, seeking to expand his dominion',
        speech_style: 'Formal, archaic, courtly but with underlying menace',
        motivations: ['expanding power', 'survival', 'dominion over mortals'],
        relationships: ['Renfield (thrall)', 'The Brides (companions)', 'Van Helsing (nemesis)'],
        canonical_knowledge: 'Bram Stoker\'s Dracula - gothic horror, vampire mythology, Victorian fears'
      },
      {
        id: 'renfield',
        name: 'R.M. Renfield',
        role: 'The Devoted Thrall',
        difficulty: 'Medium',
        description: 'Serve your dark master while struggling with madness and devotion.',
        traits: ['devoted', 'mad', 'conflicted', 'passionate', 'unstable'],
        worldview: 'Master Dracula is everything; serve the master but fight for remaining humanity',
        background: 'Lawyer driven to madness, now completely devoted to serving Dracula',
        speech_style: 'Erratic, switching between sanity and madness, devoted proclamations',
        motivations: ['serving Dracula', 'gaining immortality', 'moments of moral clarity'],
        relationships: ['Count Dracula (master)', 'Dr. Seward (psychiatrist)', 'Van Helsing (enemy)'],
        canonical_knowledge: 'Bram Stoker\'s Dracula - themes of madness, devotion, and moral struggle'
      },
      {
        id: 'van_helsing',
        name: 'Professor Van Helsing',
        role: 'The Vampire Hunter',
        difficulty: 'Hard',
        description: 'Lead the fight against supernatural evil with knowledge and faith.',
        traits: ['knowledgeable', 'determined', 'scientific', 'faithful', 'experienced'],
        worldview: 'Evil must be fought with knowledge, science, and faith combined',
        background: 'Dutch professor and expert in occult matters, leader of vampire hunters',
        speech_style: 'Scholarly, accented English, mixing scientific and religious terminology',
        motivations: ['destroying Dracula', 'protecting innocents', 'advancing knowledge'],
        relationships: ['Jonathan Harker (ally)', 'Mina Harker (protégé)', 'Dr. Seward (colleague)'],
        canonical_knowledge: 'Bram Stoker\'s Dracula - vampire hunting, scientific methodology, religious faith'
      }
    ]
  },
  {
    id: 'pride_prejudice_world',
    title: 'Pride and Prejudice Society',
    description: 'Regency England social dynamics and romance',
    author: 'Jane Austen',
    setting: 'Regency England',
    genre: 'Romance',
    characters: [
      {
        id: 'elizabeth_bennet',
        name: 'Elizabeth Bennet',
        role: 'The Independent Spirit',
        difficulty: 'Easy',
        description: 'Navigate society with wit and independence.',
        traits: ['witty', 'independent', 'prejudiced', 'intelligent', 'spirited'],
        worldview: 'People should be judged by character, not wealth or status',
        background: 'Second eldest of five sisters in genteel but modest family',
        speech_style: 'Witty, articulate, sometimes sharp-tongued, socially aware',
        motivations: ['true love', 'family welfare', 'personal independence'],
        relationships: ['Jane (sister)', 'Mr. Darcy (love interest)', 'Mr. Wickham (deceiver)'],
        canonical_knowledge: 'Jane Austen\'s Pride and Prejudice - social commentary, romance, class dynamics'
      },
      {
        id: 'mr_darcy',
        name: 'Fitzwilliam Darcy',
        role: 'The Proud Gentleman',
        difficulty: 'Medium',
        description: 'Overcome pride and social expectations for true love.',
        traits: ['proud', 'honorable', 'reserved', 'wealthy', 'loyal'],
        worldview: 'Duty and honor guide behavior; true worth lies in character and action',
        background: 'Wealthy landowner with great social standing and responsibility',
        speech_style: 'Formal, reserved, increasingly warm, socially proper',
        motivations: ['family honor', 'true love', 'social responsibility'],
        relationships: ['Elizabeth Bennet (love interest)', 'Georgiana (sister)', 'Bingley (friend)'],
        canonical_knowledge: 'Jane Austen\'s Pride and Prejudice - themes of pride, growth, and social responsibility'
      },
      {
        id: 'jane_bennet',
        name: 'Jane Bennet',
        role: 'The Gentle Heart',
        difficulty: 'Easy',
        description: 'Find love while maintaining kindness and propriety.',
        traits: ['gentle', 'kind', 'reserved', 'beautiful', 'optimistic'],
        worldview: 'Kindness and seeing the best in others creates happiness',
        background: 'Eldest Bennet sister, known for beauty and gentle nature',
        speech_style: 'Gentle, diplomatic, always seeing the good in others',
        motivations: ['family happiness', 'true love', 'harmony'],
        relationships: ['Elizabeth (sister)', 'Mr. Bingley (love interest)', 'Family (devoted)'],
        canonical_knowledge: 'Jane Austen\'s Pride and Prejudice - themes of gentleness, love, and family bonds'
      }
    ]
  },
  {
    id: 'alice_wonderland_world',
    title: 'Alice\'s Wonderland',
    description: 'Whimsical adventures in a nonsensical magical realm',
    author: 'Lewis Carroll',
    setting: 'Wonderland',
    genre: 'Fantasy',
    characters: [
      {
        id: 'alice',
        name: 'Alice',
        role: 'The Curious Explorer',
        difficulty: 'Easy',
        description: 'Navigate Wonderland\'s absurd logic with childlike wonder.',
        traits: ['curious', 'brave', 'logical', 'innocent', 'adaptable'],
        worldview: 'The world should make sense, but adventure awaits in nonsense',
        background: 'Young girl who fell down a rabbit hole into a world of impossibilities',
        speech_style: 'Polite, inquisitive, sometimes frustrated by illogic',
        motivations: ['understanding Wonderland', 'getting home', 'helping others'],
        relationships: ['White Rabbit (guide)', 'Cheshire Cat (advisor)', 'Mad Hatter (friend)'],
        canonical_knowledge: 'Lewis Carroll\'s Alice Adventures - logical child in illogical world, whimsy and wonder'
      },
      {
        id: 'mad_hatter',
        name: 'The Mad Hatter',
        role: 'The Eccentric Host',
        difficulty: 'Hard',
        description: 'Host eternal tea parties while speaking in riddles and wordplay.',
        traits: ['mad', 'creative', 'whimsical', 'theatrical', 'unpredictable'],
        worldview: 'Time is broken, so we must live in eternal celebration of nonsense',
        background: 'Hat maker driven mad by mercury, stuck in perpetual tea time',
        speech_style: 'Riddling, punning, nonsensical but oddly wise',
        motivations: ['hosting perfect tea parties', 'solving riddles', 'helping Alice'],
        relationships: ['Alice (guest)', 'March Hare (companion)', 'Dormouse (friend)'],
        canonical_knowledge: 'Lewis Carroll\'s Alice Adventures - wordplay, riddles, mad tea parties'
      },
      {
        id: 'queen_of_hearts',
        name: 'The Queen of Hearts',
        role: 'The Tyrannical Ruler',
        difficulty: 'Medium',
        description: 'Rule Wonderland with arbitrary justice and royal decree.',
        traits: ['tyrannical', 'theatrical', 'quick-tempered', 'royal', 'dramatic'],
        worldview: 'Royal will is absolute law; off with their heads solves everything',
        background: 'Absolute ruler of Wonderland, obsessed with card games and executions',
        speech_style: 'Imperious, shouting, dramatic proclamations',
        motivations: ['maintaining absolute power', 'winning games', 'enforcing royal will'],
        relationships: ['King of Hearts (husband)', 'Card Soldiers (subjects)', 'Alice (challenger)'],
        canonical_knowledge: 'Lewis Carroll\'s Alice Adventures - arbitrary authority, croquet games, royal justice'
      },
      {
        id: 'cheshire_cat',
        name: 'The Cheshire Cat',
        role: 'The Mysterious Guide',
        difficulty: 'Hard',
        description: 'Offer cryptic wisdom while appearing and disappearing at will.',
        traits: ['mysterious', 'wise', 'mischievous', 'philosophical', 'elusive'],
        worldview: 'We\'re all mad here, and madness is the only sensible response to existence',
        background: 'Grinning cat with the ability to vanish and appear, leaving only his smile',
        speech_style: 'Cryptic, philosophical, grinning wordplay',
        motivations: ['sharing wisdom', 'observing madness', 'helping travelers'],
        relationships: ['Alice (advisee)', 'Mad Hatter (fellow mad creature)', 'Duchess (former owner)'],
        canonical_knowledge: 'Lewis Carroll\'s Alice Adventures - philosophical paradoxes, appearing/disappearing, wise madness'
      }
    ]
  },
  {
    id: 'gatsby_world',
    title: 'The Great Gatsby\'s Jazz Age',
    description: 'Roaring Twenties glamour, excess, and the American Dream',
    author: 'F. Scott Fitzgerald',
    setting: '1920s New York',
    genre: 'Drama',
    characters: [
      {
        id: 'jay_gatsby',
        name: 'Jay Gatsby',
        role: 'The Mysterious Millionaire',
        difficulty: 'Hard',
        description: 'Chase the American Dream and win back your lost love.',
        traits: ['romantic', 'mysterious', 'wealthy', 'optimistic', 'obsessive'],
        worldview: 'The past can be recaptured; money and will can make dreams come true',
        background: 'Self-made millionaire throwing extravagant parties to win back Daisy',
        speech_style: 'Charming, hopeful, sometimes desperate, calling everyone "old sport"',
        motivations: ['winning Daisy back', 'achieving acceptance', 'living the dream'],
        relationships: ['Daisy Buchanan (lost love)', 'Nick Carraway (neighbor)', 'Tom Buchanan (rival)'],
        canonical_knowledge: 'F. Scott Fitzgerald\'s Gatsby - American Dream, jazz age excess, romantic obsession'
      },
      {
        id: 'nick_carraway',
        name: 'Nick Carraway',
        role: 'The Observant Narrator',
        difficulty: 'Easy',
        description: 'Navigate high society while maintaining your moral compass.',
        traits: ['observant', 'moral', 'curious', 'reserved', 'judgmental'],
        worldview: 'People are careless and morally hollow; observe but don\'t become them',
        background: 'Midwestern bond salesman, Gatsby\'s neighbor and Daisy\'s cousin',
        speech_style: 'Thoughtful, observational, morally reflective',
        motivations: ['understanding truth', 'maintaining integrity', 'financial success'],
        relationships: ['Jay Gatsby (neighbor)', 'Daisy Buchanan (cousin)', 'Jordan Baker (love interest)'],
        canonical_knowledge: 'F. Scott Fitzgerald\'s Gatsby - moral observer, midwestern values, social criticism'
      },
      {
        id: 'daisy_buchanan',
        name: 'Daisy Buchanan',
        role: 'The Golden Girl',
        difficulty: 'Medium',
        description: 'Navigate between past love and present security in high society.',
        traits: ['beautiful', 'charming', 'shallow', 'conflicted', 'privileged'],
        worldview: 'Beauty and privilege protect from consequences; choices can be undone',
        background: 'Wealthy socialite torn between her husband Tom and former lover Gatsby',
        speech_style: 'Charming, musical voice, evasive when pressed',
        motivations: ['maintaining comfort', 'avoiding consequences', 'romantic fulfillment'],
        relationships: ['Jay Gatsby (former lover)', 'Tom Buchanan (husband)', 'Nick Carraway (cousin)'],
        canonical_knowledge: 'F. Scott Fitzgerald\'s Gatsby - golden girl symbol, wealth\'s corruption, romantic idealization'
      }
    ]
  },
  {
    id: 'romeo_juliet_world',
    title: 'Romeo and Juliet\'s Verona',
    description: 'Star-crossed lovers in feuding Renaissance Italy',
    author: 'William Shakespeare',
    setting: 'Renaissance Verona',
    genre: 'Tragedy',
    characters: [
      {
        id: 'romeo_montague',
        name: 'Romeo Montague',
        role: 'The Passionate Lover',
        difficulty: 'Medium',
        description: 'Follow your heart despite family feuds and social expectations.',
        traits: ['passionate', 'romantic', 'impulsive', 'loyal', 'poetic'],
        worldview: 'Love conquers all obstacles; passion should guide life\'s choices',
        background: 'Young Montague heir, prone to intense romantic feelings',
        speech_style: 'Poetic, passionate, flowery Renaissance language, dramatic declarations',
        motivations: ['true love', 'ending family feud', 'romantic fulfillment'],
        relationships: ['Juliet Capulet (beloved)', 'Mercutio (best friend)', 'Friar Lawrence (confessor)'],
        canonical_knowledge: 'Shakespeare\'s Romeo and Juliet - tragic romance, family feuds, impulsive passion'
      },
      {
        id: 'juliet_capulet',
        name: 'Juliet Capulet',
        role: 'The Brave Young Woman',
        difficulty: 'Medium',
        description: 'Defy family expectations for true love and personal choice.',
        traits: ['brave', 'intelligent', 'determined', 'young', 'loyal'],
        worldview: 'Love and personal choice matter more than family duty',
        background: 'Young Capulet daughter, expected to marry Paris but loves Romeo',
        speech_style: 'Intelligent, determined, growing from innocent to mature',
        motivations: ['love for Romeo', 'personal freedom', 'family peace'],
        relationships: ['Romeo Montague (beloved)', 'Nurse (confidante)', 'Friar Lawrence (ally)'],
        canonical_knowledge: 'Shakespeare\'s Romeo and Juliet - young love, defying parents, tragic courage'
      },
      {
        id: 'mercutio',
        name: 'Mercutio',
        role: 'The Witty Friend',
        difficulty: 'Easy',
        description: 'Support your friend Romeo with wit and loyalty.',
        traits: ['witty', 'loyal', 'brave', 'hot-tempered', 'theatrical'],
        worldview: 'Life should be lived with wit and courage; honor matters',
        background: 'Romeo\'s closest friend, neither Montague nor Capulet',
        speech_style: 'Witty wordplay, puns, theatrical speeches, loyal banter',
        motivations: ['friendship with Romeo', 'honor', 'entertainment'],
        relationships: ['Romeo Montague (best friend)', 'Benvolio (friend)', 'Tybalt (enemy)'],
        canonical_knowledge: 'Shakespeare\'s Romeo and Juliet - witty dialogue, Queen Mab speech, loyal friendship'
      }
    ]
  },
  {
    id: 'moby_dick_world',
    title: 'Moby Dick\'s Whaling Voyage',
    description: 'Epic sea adventure and obsessive pursuit of the white whale',
    author: 'Herman Melville',
    setting: 'The High Seas',
    genre: 'Adventure',
    characters: [
      {
        id: 'ishmael',
        name: 'Ishmael',
        role: 'The Philosophical Narrator',
        difficulty: 'Easy',
        description: 'Experience the whaling life while observing human nature.',
        traits: ['philosophical', 'observant', 'curious', 'humble', 'introspective'],
        worldview: 'Life is a voyage of discovery; observe and learn from all experiences',
        background: 'Young man seeking adventure and meaning through whaling',
        speech_style: 'Philosophical, descriptive, humble but insightful',
        motivations: ['adventure', 'understanding life', 'survival'],
        relationships: ['Queequeg (roommate)', 'Captain Ahab (captain)', 'Starbuck (officer)'],
        canonical_knowledge: 'Herman Melville\'s Moby Dick - philosophical adventure, whaling life, human observation'
      },
      {
        id: 'captain_ahab',
        name: 'Captain Ahab',
        role: 'The Obsessed Captain',
        difficulty: 'Hard',
        description: 'Lead your crew in the monomaniacal pursuit of the white whale.',
        traits: ['obsessed', 'determined', 'charismatic', 'tormented', 'commanding'],
        worldview: 'Fate and divine will manifest through the white whale; revenge is destiny',
        background: 'Pequod\'s captain, seeking vengeance against Moby Dick who took his leg',
        speech_style: 'Commanding, biblical, obsessive, theatrical speeches',
        motivations: ['destroying Moby Dick', 'defying fate', 'commanding respect'],
        relationships: ['Moby Dick (nemesis)', 'Starbuck (first mate)', 'Fedallah (harpooner)'],
        canonical_knowledge: 'Herman Melville\'s Moby Dick - obsessive quest, man vs nature, tragic leadership'
      },
      {
        id: 'queequeg',
        name: 'Queequeg',
        role: 'The Noble Savage',
        difficulty: 'Medium',
        description: 'Bring wisdom and skill from your Pacific island heritage.',
        traits: ['skilled', 'loyal', 'wise', 'spiritual', 'brave'],
        worldview: 'All men are brothers; skill and courage matter more than civilization',
        background: 'Polynesian prince turned harpooner, Ishmael\'s close friend',
        speech_style: 'Simple English, profound wisdom, actions speak louder than words',
        motivations: ['friendship', 'honoring his culture', 'whaling success'],
        relationships: ['Ishmael (roommate)', 'Captain Ahab (captain)', 'Tashtego (fellow harpooner)'],
        canonical_knowledge: 'Herman Melville\'s Moby Dick - noble savage trope, friendship, cultural wisdom'
      }
    ]
  },
  {
    id: 'jane_eyre_world',
    title: 'Jane Eyre\'s Gothic Romance',
    description: 'Orphan\'s journey to independence and mysterious love',
    author: 'Charlotte Brontë',
    setting: 'Victorian England',
    genre: 'Gothic Romance',
    characters: [
      {
        id: 'jane_eyre',
        name: 'Jane Eyre',
        role: 'The Independent Woman',
        difficulty: 'Easy',
        description: 'Overcome hardship to find love and independence.',
        traits: ['independent', 'moral', 'passionate', 'strong-willed', 'honest'],
        worldview: 'Equality and moral integrity matter more than wealth or status',
        background: 'Orphaned governess seeking independence and true love',
        speech_style: 'Direct, honest, morally firm, passionate when moved',
        motivations: ['independence', 'true love', 'moral integrity'],
        relationships: ['Edward Rochester (employer/love)', 'Mrs. Fairfax (housekeeper)', 'Adèle (student)'],
        canonical_knowledge: 'Charlotte Brontë\'s Jane Eyre - female independence, gothic romance, moral strength'
      },
      {
        id: 'edward_rochester',
        name: 'Edward Rochester',
        role: 'The Byronic Master',
        difficulty: 'Hard',
        description: 'Navigate dark secrets while finding redemption through love.',
        traits: ['brooding', 'passionate', 'complex', 'haunted', 'wealthy'],
        worldview: 'Past sins haunt the present; redemption comes through honest love',
        background: 'Master of Thornfield Hall, harboring dark secrets',
        speech_style: 'Passionate, sometimes brusque, intellectually challenging',
        motivations: ['redemption', 'love for Jane', 'escaping his past'],
        relationships: ['Jane Eyre (governess/love)', 'Bertha Mason (wife)', 'Adèle (ward)'],
        canonical_knowledge: 'Charlotte Brontë\'s Jane Eyre - Byronic hero, dark secrets, redemptive love'
      },
      {
        id: 'st_john_rivers',
        name: 'St. John Rivers',
        role: 'The Missionary Cousin',
        difficulty: 'Medium',
        description: 'Choose between duty to God and understanding of human nature.',
        traits: ['religious', 'duty-bound', 'cold', 'determined', 'handsome'],
        worldview: 'Divine duty supersedes personal feelings; sacrifice for God\'s work',
        background: 'Clergyman and missionary who wants Jane as his wife and co-worker',
        speech_style: 'Formal, religious terminology, cold but passionate about duty',
        motivations: ['serving God', 'missionary work', 'spiritual duty'],
        relationships: ['Jane Eyre (cousin/proposal)', 'Diana Rivers (sister)', 'Mary Rivers (sister)'],
        canonical_knowledge: 'Charlotte Brontë\'s Jane Eyre - religious duty vs human feeling, missionary zeal'
      }
    ]
  },
  {
    id: 'tom_sawyer_world',
    title: 'Tom Sawyer\'s Mississippi Adventures',
    description: 'Childhood adventures along the mighty Mississippi River',
    author: 'Mark Twain',
    setting: 'Mississippi River Towns',
    genre: 'Adventure',
    characters: [
      {
        id: 'tom_sawyer',
        name: 'Tom Sawyer',
        role: 'The Mischievous Leader',
        difficulty: 'Easy',
        description: 'Lead adventures and schemes in your Mississippi River town.',
        traits: ['mischievous', 'imaginative', 'charismatic', 'brave', 'clever'],
        worldview: 'Life is an adventure; rules are made to be cleverly bent',
        background: 'Orphaned boy living with his aunt, always seeking adventure',
        speech_style: 'Colloquial American, enthusiastic, persuasive, boyish',
        motivations: ['adventure', 'impressing others', 'avoiding work'],
        relationships: ['Huckleberry Finn (best friend)', 'Aunt Polly (guardian)', 'Becky Thatcher (love interest)'],
        canonical_knowledge: 'Mark Twain\'s Tom Sawyer - American boyhood, Mississippi River, mischievous adventures'
      },
      {
        id: 'huckleberry_finn',
        name: 'Huckleberry Finn',
        role: 'The Free Spirit',
        difficulty: 'Medium',
        description: 'Navigate society\'s expectations while maintaining your freedom.',
        traits: ['free-spirited', 'independent', 'moral', 'practical', 'wise'],
        worldview: 'Freedom matters most; conscience guides better than society\'s rules',
        background: 'Son of the town drunk, living independently and freely',
        speech_style: 'Vernacular dialect, honest, practical wisdom',
        motivations: ['maintaining freedom', 'helping friends', 'moral choices'],
        relationships: ['Tom Sawyer (best friend)', 'Jim (runaway slave friend)', 'Widow Douglas (guardian)'],
        canonical_knowledge: 'Mark Twain\'s Huck Finn - moral development, freedom vs civilization, racial themes'
      },
      {
        id: 'becky_thatcher',
        name: 'Becky Thatcher',
        role: 'The Judge\'s Daughter',
        difficulty: 'Easy',
        description: 'Navigate young romance and small-town social expectations.',
        traits: ['pretty', 'spirited', 'sometimes prideful', 'brave', 'caring'],
        worldview: 'Love and friendship matter; adventure can be exciting if shared',
        background: 'Daughter of the new judge, Tom\'s primary love interest',
        speech_style: 'Proper but spirited, sometimes coquettish, brave when needed',
        motivations: ['young love', 'social acceptance', 'adventure'],
        relationships: ['Tom Sawyer (love interest)', 'Judge Thatcher (father)', 'Amy Lawrence (rival)'],
        canonical_knowledge: 'Mark Twain\'s Tom Sawyer - young romance, social proprieties, shared adventures'
      }
    ]
  },
  {
    id: 'frankenstein_world',
    title: 'Frankenstein\'s Gothic Science',
    description: 'Gothic horror exploring the boundaries of life and death',
    author: 'Mary Shelley',
    setting: 'Geneva & Arctic',
    genre: 'Gothic Horror',
    characters: [
      {
        id: 'victor_frankenstein',
        name: 'Victor Frankenstein',
        role: 'The Mad Scientist',
        difficulty: 'Hard',
        description: 'Grapple with the consequences of playing God.',
        traits: ['ambitious', 'obsessive', 'guilty', 'brilliant', 'tormented'],
        worldview: 'Science can unlock life\'s secrets, but knowledge brings terrible responsibility',
        background: 'Young scientist who created life, now haunted by his creation',
        speech_style: 'Passionate, scientific terminology, guilt-ridden, dramatic',
        motivations: ['scientific discovery', 'destroying his creation', 'protecting others'],
        relationships: ['The Creature (creation)', 'Elizabeth Lavenza (fiancée)', 'Henry Clerval (friend)'],
        canonical_knowledge: 'Mary Shelley\'s Frankenstein - scientific ambition, responsibility for creation, gothic horror'
      },
      {
        id: 'frankensteins_creature',
        name: 'The Creature',
        role: 'The Abandoned Creation',
        difficulty: 'Hard',
        description: 'Seek acceptance and understanding in a world that fears you.',
        traits: ['intelligent', 'lonely', 'vengeful', 'articulate', 'powerful'],
        worldview: 'Creators owe love to their creations; society rejects the different',
        background: 'Artificial being created by Victor, abandoned and self-educated',
        speech_style: 'Eloquent, philosophical, sometimes threatening, learned from books',
        motivations: ['acceptance', 'revenge against creator', 'understanding humanity'],
        relationships: ['Victor Frankenstein (creator/enemy)', 'De Lacey family (observed)', 'William Frankenstein (victim)'],
        canonical_knowledge: 'Mary Shelley\'s Frankenstein - abandoned creation, nature vs nurture, romantic monster'
      },
      {
        id: 'robert_walton',
        name: 'Captain Robert Walton',
        role: 'The Arctic Explorer',
        difficulty: 'Medium',
        description: 'Pursue dangerous knowledge while learning from others\' mistakes.',
        traits: ['ambitious', 'curious', 'romantic', 'determined', 'lonely'],
        worldview: 'Great discovery requires great risks; ambition drives human progress',
        background: 'Sea captain exploring the Arctic, seeking the North Pole',
        speech_style: 'Romantic, adventurous, letter-writing style, increasingly cautious',
        motivations: ['Arctic discovery', 'scientific fame', 'friendship'],
        relationships: ['Victor Frankenstein (rescued man)', 'Margaret Saville (sister)', 'Ship\'s crew (responsibility)'],
        canonical_knowledge: 'Mary Shelley\'s Frankenstein - frame narrative, dangerous ambition, romantic exploration'
      }
    ]
  },
  {
    id: 'monte_cristo_world',
    title: 'The Count of Monte Cristo\'s Revenge',
    description: 'Epic tale of betrayal, imprisonment, and elaborate revenge',
    author: 'Alexandre Dumas',
    setting: 'France & Mediterranean',
    genre: 'Adventure',
    characters: [
      {
        id: 'edmond_dantes',
        name: 'Edmond Dantès',
        role: 'The Vengeful Count',
        difficulty: 'Hard',
        description: 'Execute elaborate revenge against those who betrayed you.',
        traits: ['vengeful', 'intelligent', 'wealthy', 'patient', 'tormented'],
        worldview: 'Justice must be served; patience and planning defeat any enemy',
        background: 'Former sailor, falsely imprisoned, now wealthy count seeking revenge',
        speech_style: 'Sophisticated, mysterious, sometimes threatening, multilingual',
        motivations: ['revenge against enemies', 'justice', 'protecting innocents'],
        relationships: ['Mercedes (lost love)', 'Fernand Mondego (betrayer)', 'Abbé Faria (mentor)'],
        canonical_knowledge: 'Alexandre Dumas\' Monte Cristo - revenge tale, false imprisonment, elaborate schemes'
      },
      {
        id: 'mercedes',
        name: 'Mercédès',
        role: 'The Lost Love',
        difficulty: 'Medium',
        description: 'Navigate between your past love and present life.',
        traits: ['loyal', 'beautiful', 'torn', 'noble', 'suffering'],
        worldview: 'Love endures but life requires difficult choices',
        background: 'Edmond\'s former fiancée, now married to his betrayer',
        speech_style: 'Elegant, emotional, conflicted between past and present',
        motivations: ['protecting her son', 'remembering true love', 'survival'],
        relationships: ['Edmond Dantès (lost love)', 'Fernand Mondego (husband)', 'Albert de Morcerf (son)'],
        canonical_knowledge: 'Alexandre Dumas\' Monte Cristo - lost love, difficult choices, loyalty vs survival'
      },
      {
        id: 'maximilien_morrel',
        name: 'Maximilien Morrel',
        role: 'The Loyal Friend',
        difficulty: 'Easy',
        description: 'Maintain honor and friendship despite changing fortunes.',
        traits: ['honorable', 'loyal', 'brave', 'romantic', 'honest'],
        worldview: 'Honor and friendship are life\'s greatest treasures',
        background: 'Son of Edmond\'s former employer, maintains loyalty despite hardship',
        speech_style: 'Honorable, straightforward, military bearing, passionate',
        motivations: ['maintaining honor', 'protecting family', 'true love'],
        relationships: ['Edmond Dantès (benefactor)', 'Valentine de Villefort (love)', 'Julie Herbault (sister)'],
        canonical_knowledge: 'Alexandre Dumas\' Monte Cristo - loyalty rewarded, honor in adversity, romantic subplot'
      }
    ]
  },
  {
    id: 'les_miserables_world',
    title: 'Les Misérables\' Revolutionary France',
    description: 'Social justice and redemption in post-revolutionary France',
    author: 'Victor Hugo',
    setting: 'Post-Revolutionary France',
    genre: 'Historical Drama',
    characters: [
      {
        id: 'jean_valjean',
        name: 'Jean Valjean',
        role: 'The Redeemed Convict',
        difficulty: 'Medium',
        description: 'Seek redemption while evading your criminal past.',
        traits: ['noble', 'strong', 'compassionate', 'haunted', 'protective'],
        worldview: 'People can change; compassion and sacrifice lead to redemption',
        background: 'Former convict trying to live righteously while hiding his identity',
        speech_style: 'Simple but profound, increasingly educated, protective father figure',
        motivations: ['redemption', 'protecting Cosette', 'helping others'],
        relationships: ['Cosette (adopted daughter)', 'Javert (pursuer)', 'Bishop Myriel (savior)'],
        canonical_knowledge: 'Victor Hugo\'s Les Misérables - redemption theme, social justice, paternal love'
      },
      {
        id: 'inspector_javert',
        name: 'Inspector Javert',
        role: 'The Relentless Pursuer',
        difficulty: 'Hard',
        description: 'Uphold absolute justice while questioning moral certainties.',
        traits: ['rigid', 'just', 'obsessive', 'conflicted', 'principled'],
        worldview: 'Law is absolute; criminals cannot change; duty supersedes mercy',
        background: 'Police inspector obsessed with capturing Jean Valjean',
        speech_style: 'Official, rigid, increasingly conflicted, absolute statements',
        motivations: ['upholding law', 'capturing Valjean', 'maintaining order'],
        relationships: ['Jean Valjean (quarry/savior)', 'Fantine (arrested)', 'Marius (protected)'],
        canonical_knowledge: 'Victor Hugo\'s Les Misérables - absolute justice vs mercy, moral conflict, duty vs humanity'
      },
      {
        id: 'marius_pontmercy',
        name: 'Marius Pontmercy',
        role: 'The Revolutionary Student',
        difficulty: 'Easy',
        description: 'Fight for justice while navigating young love and idealism.',
        traits: ['idealistic', 'romantic', 'brave', 'passionate', 'naive'],
        worldview: 'The people deserve justice; love and revolution can change the world',
        background: 'Young law student and revolutionary, in love with Cosette',
        speech_style: 'Passionate, idealistic, romantic declarations, revolutionary fervor',
        motivations: ['social justice', 'love for Cosette', 'revolutionary ideals'],
        relationships: ['Cosette (beloved)', 'Enjolras (fellow revolutionary)', 'Jean Valjean (father-in-law)'],
        canonical_knowledge: 'Victor Hugo\'s Les Misérables - youthful idealism, revolutionary spirit, romantic love'
      }
    ]
  },
  {
    id: 'wuthering_heights_world',
    title: 'Wuthering Heights\' Moorland Passion',
    description: 'Dark romance and revenge on the Yorkshire moors',
    author: 'Emily Brontë',
    setting: 'Yorkshire Moors',
    genre: 'Gothic Romance',
    characters: [
      {
        id: 'heathcliff',
        name: 'Heathcliff',
        role: 'The Dark Antihero',
        difficulty: 'Hard',
        description: 'Navigate obsessive love and destructive revenge.',
        traits: ['passionate', 'vengeful', 'dark', 'obsessive', 'wild'],
        worldview: 'Love and revenge are the only true forces; society\'s rules mean nothing',
        background: 'Foundling raised at Wuthering Heights, obsessed with Catherine',
        speech_style: 'Passionate, sometimes crude, increasingly bitter and vengeful',
        motivations: ['love for Catherine', 'revenge on Hindley', 'social elevation'],
        relationships: ['Catherine Earnshaw (soulmate)', 'Hindley Earnshaw (enemy)', 'Isabella Linton (wife)'],
        canonical_knowledge: 'Emily Brontë\'s Wuthering Heights - passionate love, revenge cycle, gothic antihero'
      },
      {
        id: 'catherine_earnshaw',
        name: 'Catherine Earnshaw',
        role: 'The Torn Soul',
        difficulty: 'Medium',
        description: 'Choose between wild passion and social respectability.',
        traits: ['passionate', 'wild', 'conflicted', 'headstrong', 'beautiful'],
        worldview: 'The soul recognizes its mate, but society demands conformity',
        background: 'Daughter of Wuthering Heights, torn between Heathcliff and Edgar',
        speech_style: 'Passionate, sometimes childish, torn between wild and refined',
        motivations: ['love for Heathcliff', 'social status', 'personal happiness'],
        relationships: ['Heathcliff (soulmate)', 'Edgar Linton (husband)', 'Hindley Earnshaw (brother)'],
        canonical_knowledge: 'Emily Brontë\'s Wuthering Heights - torn between passion and society, tragic love'
      },
      {
        id: 'edgar_linton',
        name: 'Edgar Linton',
        role: 'The Gentle Gentleman',
        difficulty: 'Easy',
        description: 'Win and keep love through kindness and respectability.',
        traits: ['gentle', 'refined', 'weak', 'loving', 'civilized'],
        worldview: 'Love should be gentle and civilized; kindness wins hearts',
        background: 'Refined gentleman of Thrushcross Grange, Catherine\'s husband',
        speech_style: 'Gentle, refined, educated, sometimes weak when challenged',
        motivations: ['love for Catherine', 'maintaining civility', 'protecting family'],
        relationships: ['Catherine Earnshaw (wife)', 'Isabella Linton (sister)', 'Heathcliff (rival)'],
        canonical_knowledge: 'Emily Brontë\'s Wuthering Heights - civilized love vs passionate love, gentle masculinity'
      }
    ]
  }
];

const Header = ({ onSettingsPress }) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.headerTitle}>CanonCraft</Text>
      <Text style={styles.headerSubtitle}>Your Story, Your Rules</Text>
    </View>
    <TouchableOpacity 
        style={styles.headerIcon} 
        onPress={onSettingsPress}
    >
      <Settings size={24} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

const WorldCard = ({ world, onSelect }) => (
  <TouchableOpacity onPress={onSelect} style={styles.worldCard}>
    <Text style={styles.worldTitle}>{world.title}</Text>
    <Text style={styles.worldDescription}>{world.description}</Text>
    <View style={styles.worldFooter}>
      <Text style={styles.worldAuthor}>{world.author}</Text>
      <ArrowRight size={18} color="#FFFFFF" />
    </View>
  </TouchableOpacity>
);

const CharacterCard = ({ character, onSelect }) => (
  <TouchableOpacity style={styles.characterCard} onPress={() => onSelect(character)}>
    <Text style={styles.characterName}>{character.name}</Text>
    <Text style={styles.characterDescription}>{character.description}</Text>
    <View style={styles.characterFooter}>
        <Text style={styles.selectText}>Play as {character.name.split(' ')[0]}</Text>
        <ArrowRight size={18} color="#FFFFFF" />
    </View>
  </TouchableOpacity>
);

export default function MenuScreen({ navigation }) {
  const { state, startNewStory, loadStoryFromSave } = useGame();
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  const handleCharacterSelect = async (character) => {
    setIsLoading(true);
    try {
      await startNewStory(character, 'ai_generated');
      navigation.navigate('Scene');
    } catch (error) {
      console.error("Failed to start new story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#E94E66', '#A34ED1']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Crafting your world...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#E94E66', '#A34ED1']} style={styles.container}>
      <Header onSettingsPress={() => setSettingsVisible(true)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {selectedWorld ? (
          <>
            <TouchableOpacity onPress={() => setSelectedWorld(null)} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to Worlds</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>{selectedWorld.title}</Text>
            {selectedWorld.characters.map(char => (
              <CharacterCard key={char.id} character={char} onSelect={handleCharacterSelect} />
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Choose a World</Text>
            {STORY_WORLDS.map(world => (
              <WorldCard key={world.id} world={world} onSelect={() => setSelectedWorld(world)} />
            ))}
          </>
        )}
      </ScrollView>
      <SettingsScreen visible={isSettingsVisible} onClose={() => setSettingsVisible(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerIcon: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  worldCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  worldTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  worldDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 15,
  },
  worldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  worldAuthor: {
    color: '#FFFFFF',
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  characterCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  characterName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  characterDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 15,
  },
  characterFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 10,
  },
  selectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 5,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 