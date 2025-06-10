/**
 * InCharacter Phase 8: Creator Tools Service
 * Advanced character creation, story templates, educational tools, and community features
 */

import { openai, MODEL_CONFIGS } from '../config.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { characterTraitMatrix } from './characterTraitMatrix.js';
import { enhancedPersonaScoring } from './enhancedPersonaScoring.js';

// Character creation templates
const CHARACTER_TEMPLATES = {
  classic_literature: {
    name: 'Classic Literature Character',
    description: 'Traditional literary character with period-appropriate traits',
    requiredFields: ['name', 'era', 'socialClass', 'primaryTrait', 'motivation'],
    traitCategories: ['intellectual', 'emotional', 'social', 'moral', 'behavioral'],
    defaultEra: 'victorian',
    complexityLevel: 'intermediate'
  },
  modern_adaptation: {
    name: 'Modern Adaptation',
    description: 'Contemporary version of classic characters',
    requiredFields: ['name', 'originalCharacter', 'modernContext', 'adaptedTraits'],
    traitCategories: ['psychological', 'social', 'technological', 'cultural'],
    defaultEra: 'contemporary',
    complexityLevel: 'advanced'
  },
  educational_archetype: {
    name: 'Educational Archetype',
    description: 'Designed for specific learning objectives',
    requiredFields: ['name', 'learningObjective', 'gradeLevel', 'subjectArea'],
    traitCategories: ['pedagogical', 'relatable', 'inspirational', 'challenging'],
    defaultEra: 'flexible',
    complexityLevel: 'beginner'
  },
  student_creation: {
    name: 'Student Creation',
    description: 'Simplified character creation for student projects',
    requiredFields: ['name', 'basicPersonality', 'mainGoal', 'obstacle'],
    traitCategories: ['simple', 'clear', 'engaging'],
    defaultEra: 'any',
    complexityLevel: 'beginner'
  }
};

// Educational assessment frameworks
const ASSESSMENT_FRAMEWORKS = {
  reading_comprehension: {
    name: 'Reading Comprehension Assessment',
    metrics: ['textual_understanding', 'character_analysis', 'theme_recognition', 'inference_skills'],
    scoring: 'rubric_based',
    adaptiveQuestions: true
  },
  creative_writing: {
    name: 'Creative Writing Evaluation',
    metrics: ['narrative_structure', 'character_development', 'dialogue_quality', 'originality'],
    scoring: 'portfolio_based',
    adaptiveQuestions: false
  },
  character_authenticity: {
    name: 'Character Authenticity Mastery',
    metrics: ['source_fidelity', 'psychological_consistency', 'period_accuracy', 'emotional_depth'],
    scoring: 'persona_matrix',
    adaptiveQuestions: true
  },
  literary_analysis: {
    name: 'Literary Analysis Skills',
    metrics: ['symbolism_recognition', 'thematic_analysis', 'contextual_understanding', 'critical_thinking'],
    scoring: 'analytical_framework',
    adaptiveQuestions: true
  }
};

// Story template categories
const STORY_TEMPLATES = {
  character_introduction: {
    name: 'Character Introduction',
    description: 'Meet a character in their natural environment',
    scenes: 3,
    difficulty: 'beginner',
    learningObjectives: ['character_understanding', 'setting_analysis'],
    estimatedTime: '15-20 minutes'
  },
  moral_dilemma: {
    name: 'Moral Dilemma',
    description: 'Navigate complex ethical decisions with your character',
    scenes: 5,
    difficulty: 'intermediate',
    learningObjectives: ['ethical_reasoning', 'character_motivation', 'consequence_analysis'],
    estimatedTime: '25-35 minutes'
  },
  character_development: {
    name: 'Character Development Arc',
    description: 'Experience a complete character transformation journey',
    scenes: 7,
    difficulty: 'advanced',
    learningObjectives: ['psychological_growth', 'narrative_structure', 'thematic_development'],
    estimatedTime: '45-60 minutes'
  },
  comparative_literature: {
    name: 'Comparative Character Study',
    description: 'Explore how different characters would handle the same situation',
    scenes: 4,
    difficulty: 'advanced',
    learningObjectives: ['character_comparison', 'perspective_analysis', 'cultural_context'],
    estimatedTime: '30-40 minutes'
  }
};

/**
 * Creator Tools Service Class
 * Handles character creation, educational assessments, and community features
 */
class CreatorToolsService {
  constructor() {
    this.customCharacters = new Map();
    this.storyTemplates = new Map();
    this.educationalAssessments = new Map();
    this.communityContent = new Map();
    this.classroomSessions = new Map();
  }

  /**
   * Initialize creator tools system
   */
  async initializeCreatorTools(userType = 'student', permissions = {}) {
    console.log('🛠️ Initializing Phase 8 Creator Tools for:', userType);
    
    try {
      // Set user permissions
      this.userType = userType;
      this.permissions = {
        createCharacters: permissions.createCharacters !== false,
        createStoryTemplates: permissions.createStoryTemplates || (userType === 'educator'),
        accessAssessments: permissions.accessAssessments !== false,
        manageClassroom: permissions.manageClassroom || (userType === 'educator'),
        publishCommunity: permissions.publishCommunity !== false,
        ...permissions
      };
      
      // Load existing content
      await this.loadUserContent();
      
      // Initialize educational features if educator
      if (userType === 'educator') {
        await this.initializeEducationalFeatures();
      }
      
      console.log('✅ Creator tools initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize creator tools:', error);
      return false;
    }
  }

  /**
   * Create custom character using AI assistance
   */
  async createCustomCharacter(characterData, template = 'classic_literature') {
    console.log('👤 Creating custom character with template:', template);
    
    try {
      const templateConfig = CHARACTER_TEMPLATES[template];
      if (!templateConfig) {
        throw new Error(`Invalid template: ${template}`);
      }
      
      // Validate required fields
      const missingFields = templateConfig.requiredFields.filter(
        field => !characterData[field] || characterData[field].trim() === ''
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Generate AI-enhanced character profile
      const enhancedCharacter = await this.generateAICharacterProfile(characterData, templateConfig);
      
      // Create trait matrix for character
      const traitMatrix = await this.generateCharacterTraitMatrix(enhancedCharacter, templateConfig);
      
      // Generate voice and visual profiles
      const mediaProfiles = await this.generateCharacterMediaProfiles(enhancedCharacter);
      
      // Compile complete character
      const customCharacter = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...enhancedCharacter,
        template: template,
        traitMatrix: traitMatrix,
        mediaProfiles: mediaProfiles,
        created: new Date().toISOString(),
        creator: this.userType,
        validated: false,
        published: false
      };
      
      // Store character
      this.customCharacters.set(customCharacter.id, customCharacter);
      await this.saveCharacterToStorage(customCharacter);
      
      console.log('✅ Custom character created:', customCharacter.name);
      return customCharacter;
    } catch (error) {
      console.error('❌ Failed to create custom character:', error);
      throw error;
    }
  }

  /**
   * Generate AI-enhanced character profile
   */
  async generateAICharacterProfile(characterData, templateConfig) {
    const prompt = `Create a detailed literary character profile based on the following information:
    
    Name: ${characterData.name}
    Era: ${characterData.era || templateConfig.defaultEra}
    Template: ${templateConfig.name}
    Basic Info: ${JSON.stringify(characterData, null, 2)}
    
    Please generate:
    1. A compelling backstory that fits the era and character type
    2. Detailed personality traits organized by: ${templateConfig.traitCategories.join(', ')}
    3. Character motivations and internal conflicts
    4. Speech patterns and distinctive mannerisms
    5. Relationships with others and social dynamics
    6. Character arc potential and growth opportunities
    
    Format as a detailed character profile suitable for interactive storytelling.
    Focus on authenticity to the era and literary depth.`;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL_CONFIGS.character_creation.model,
        messages: [
          {
            role: 'system',
            content: 'You are a literary character creation expert specializing in authentic, well-developed characters for educational interactive fiction.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: MODEL_CONFIGS.character_creation.temperature
      });

      const aiProfile = response.choices[0]?.message?.content;
      
      // Parse and structure the AI response
      return {
        ...characterData,
        aiGeneratedProfile: aiProfile,
        backstory: this.extractBackstory(aiProfile),
        personalityTraits: this.extractPersonalityTraits(aiProfile),
        speechPatterns: this.extractSpeechPatterns(aiProfile),
        relationships: this.extractRelationships(aiProfile),
        characterArc: this.extractCharacterArc(aiProfile)
      };
    } catch (error) {
      console.error('Failed to generate AI character profile:', error);
      // Return basic profile if AI fails
      return {
        ...characterData,
        backstory: `${characterData.name} is a character from the ${characterData.era} era with a rich inner life and compelling story.`,
        personalityTraits: ['thoughtful', 'determined', 'complex'],
        speechPatterns: 'Speaks in a manner appropriate to their time period and social standing.',
        relationships: 'Forms meaningful connections with others in their world.',
        characterArc: 'Has potential for significant growth and development throughout their story.'
      };
    }
  }

  /**
   * Generate character trait matrix
   */
  async generateCharacterTraitMatrix(characterData, templateConfig) {
    try {
      // Use existing trait matrix system with custom character data
      const traitMatrix = characterTraitMatrix.createCustomCharacterMatrix(
        characterData.id,
        characterData.personalityTraits,
        templateConfig.traitCategories
      );
      
      return traitMatrix;
    } catch (error) {
      console.error('Failed to generate trait matrix:', error);
      return null;
    }
  }

  /**
   * Generate character media profiles
   */
  async generateCharacterMediaProfiles(characterData) {
    try {
      // Generate voice profile
      const voiceProfile = {
        voiceId: this.selectVoiceForCharacter(characterData),
        accent: characterData.era === 'victorian' ? 'british' : 'neutral',
        pace: characterData.personalityTraits?.includes('energetic') ? 'lively' : 'measured',
        tone: this.determineVoiceTone(characterData.personalityTraits),
        style: characterData.era === 'contemporary' ? 'conversational' : 'formal'
      };
      
      // Generate visual profile
      const visualProfile = {
        style: this.determineArtStyle(characterData.era),
        palette: this.generateColorPalette(characterData),
        lighting: this.determineLighting(characterData.era),
        atmosphere: this.determineAtmosphere(characterData.personalityTraits)
      };
      
      return {
        voice: voiceProfile,
        visual: visualProfile
      };
    } catch (error) {
      console.error('Failed to generate media profiles:', error);
      return null;
    }
  }

  /**
   * Create story template
   */
  async createStoryTemplate(templateData) {
    if (!this.permissions.createStoryTemplates) {
      throw new Error('User does not have permission to create story templates');
    }
    
    console.log('📚 Creating story template:', templateData.name);
    
    try {
      // Generate AI-enhanced template structure
      const enhancedTemplate = await this.generateAIStoryTemplate(templateData);
      
      const storyTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...enhancedTemplate,
        created: new Date().toISOString(),
        creator: this.userType,
        published: false,
        usage_count: 0
      };
      
      this.storyTemplates.set(storyTemplate.id, storyTemplate);
      await this.saveTemplateToStorage(storyTemplate);
      
      console.log('✅ Story template created successfully');
      return storyTemplate;
    } catch (error) {
      console.error('❌ Failed to create story template:', error);
      throw error;
    }
  }

  /**
   * Generate educational assessment
   */
  async createEducationalAssessment(assessmentData, framework = 'reading_comprehension') {
    if (!this.permissions.accessAssessments) {
      throw new Error('User does not have permission to create assessments');
    }
    
    console.log('📊 Creating educational assessment with framework:', framework);
    
    try {
      const frameworkConfig = ASSESSMENT_FRAMEWORKS[framework];
      if (!frameworkConfig) {
        throw new Error(`Invalid assessment framework: ${framework}`);
      }
      
      // Generate assessment questions and rubric
      const assessmentQuestions = await this.generateAssessmentQuestions(assessmentData, frameworkConfig);
      const scoringRubric = await this.generateScoringRubric(frameworkConfig);
      
      const assessment = {
        id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...assessmentData,
        framework: framework,
        questions: assessmentQuestions,
        rubric: scoringRubric,
        adaptiveQuestions: frameworkConfig.adaptiveQuestions,
        created: new Date().toISOString(),
        creator: this.userType
      };
      
      this.educationalAssessments.set(assessment.id, assessment);
      await this.saveAssessmentToStorage(assessment);
      
      console.log('✅ Educational assessment created successfully');
      return assessment;
    } catch (error) {
      console.error('❌ Failed to create educational assessment:', error);
      throw error;
    }
  }

  /**
   * Manage classroom session
   */
  async createClassroomSession(sessionData) {
    if (!this.permissions.manageClassroom) {
      throw new Error('User does not have permission to manage classroom sessions');
    }
    
    console.log('🎓 Creating classroom session:', sessionData.name);
    
    try {
      const classroomSession = {
        id: `classroom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...sessionData,
        students: [],
        activities: [],
        assessments: [],
        startTime: new Date().toISOString(),
        status: 'active',
        educator: this.userType
      };
      
      this.classroomSessions.set(classroomSession.id, classroomSession);
      await this.saveClassroomToStorage(classroomSession);
      
      console.log('✅ Classroom session created successfully');
      return classroomSession;
    } catch (error) {
      console.error('❌ Failed to create classroom session:', error);
      throw error;
    }
  }

  /**
   * Validate and publish community content
   */
  async publishCommunityContent(contentId, contentType) {
    if (!this.permissions.publishCommunity) {
      throw new Error('User does not have permission to publish community content');
    }
    
    console.log('🌟 Publishing community content:', contentId);
    
    try {
      let content;
      
      switch (contentType) {
        case 'character':
          content = this.customCharacters.get(contentId);
          break;
        case 'template':
          content = this.storyTemplates.get(contentId);
          break;
        default:
          throw new Error(`Invalid content type: ${contentType}`);
      }
      
      if (!content) {
        throw new Error(`Content not found: ${contentId}`);
      }
      
      // Validate content before publishing
      const validationResult = await this.validateContent(content, contentType);
      
      if (!validationResult.isValid) {
        throw new Error(`Content validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Publish content
      content.published = true;
      content.publishedDate = new Date().toISOString();
      content.validated = true;
      
      // Add to community content
      this.communityContent.set(contentId, {
        ...content,
        contentType: contentType,
        rating: 0,
        downloads: 0,
        reviews: []
      });
      
      await this.saveCommunityContent(content);
      
      console.log('✅ Content published to community successfully');
      return content;
    } catch (error) {
      console.error('❌ Failed to publish community content:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  async loadUserContent() {
    try {
      const storedCharacters = await AsyncStorage.getItem('custom_characters');
      const storedTemplates = await AsyncStorage.getItem('story_templates');
      const storedAssessments = await AsyncStorage.getItem('educational_assessments');
      
      if (storedCharacters) {
        const characters = JSON.parse(storedCharacters);
        characters.forEach(char => this.customCharacters.set(char.id, char));
      }
      
      if (storedTemplates) {
        const templates = JSON.parse(storedTemplates);
        templates.forEach(template => this.storyTemplates.set(template.id, template));
      }
      
      if (storedAssessments) {
        const assessments = JSON.parse(storedAssessments);
        assessments.forEach(assessment => this.educationalAssessments.set(assessment.id, assessment));
      }
    } catch (error) {
      console.error('Failed to load user content:', error);
    }
  }

  async initializeEducationalFeatures() {
    // Initialize educator-specific features
    console.log('🎓 Initializing educational features for educator');
    
    // Load pre-built educational templates
    Object.entries(STORY_TEMPLATES).forEach(([key, template]) => {
      if (!this.storyTemplates.has(key)) {
        this.storyTemplates.set(key, { ...template, id: key, builtin: true });
      }
    });
  }

  extractBackstory(aiProfile) {
    // Extract backstory from AI-generated profile
    const backstoryMatch = aiProfile.match(/backstory[:\-\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    return backstoryMatch ? backstoryMatch[1].trim() : 'Rich character background to be explored in stories.';
  }

  extractPersonalityTraits(aiProfile) {
    // Extract personality traits from AI-generated profile
    const traitsMatch = aiProfile.match(/personality[:\-\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    if (traitsMatch) {
      return traitsMatch[1].split(/[,;]\s*/).map(trait => trait.trim().toLowerCase());
    }
    return ['thoughtful', 'complex', 'authentic'];
  }

  extractSpeechPatterns(aiProfile) {
    const speechMatch = aiProfile.match(/speech[:\-\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    return speechMatch ? speechMatch[1].trim() : 'Speaks authentically to their character and era.';
  }

  extractRelationships(aiProfile) {
    const relationshipsMatch = aiProfile.match(/relationships?[:\-\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    return relationshipsMatch ? relationshipsMatch[1].trim() : 'Forms meaningful connections with others.';
  }

  extractCharacterArc(aiProfile) {
    const arcMatch = aiProfile.match(/(?:character\s+arc|growth)[:\-\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    return arcMatch ? arcMatch[1].trim() : 'Has potential for significant development throughout stories.';
  }

  selectVoiceForCharacter(characterData) {
    // Select appropriate voice based on character traits
    const traits = characterData.personalityTraits || [];
    
    if (traits.includes('intellectual') || traits.includes('analytical')) return 'alloy';
    if (traits.includes('mysterious') || traits.includes('dark')) return 'echo';
    if (traits.includes('spirited') || traits.includes('energetic')) return 'nova';
    if (traits.includes('melancholic') || traits.includes('poetic')) return 'fable';
    if (traits.includes('gentle') || traits.includes('determined')) return 'shimmer';
    
    return 'alloy'; // Default
  }

  determineVoiceTone(traits = []) {
    if (traits.includes('wise') || traits.includes('intellectual')) return 'thoughtful';
    if (traits.includes('energetic') || traits.includes('spirited')) return 'lively';
    if (traits.includes('mysterious') || traits.includes('dark')) return 'mysterious';
    if (traits.includes('gentle') || traits.includes('kind')) return 'warm';
    return 'balanced';
  }

  determineArtStyle(era) {
    switch (era) {
      case 'victorian': return 'victorian_illustration';
      case 'medieval': return 'medieval_manuscript';
      case 'renaissance': return 'renaissance_painting';
      case 'regency': return 'regency_watercolor';
      case 'gothic': return 'gothic_art';
      case 'contemporary': return 'modern_illustration';
      default: return 'classic_illustration';
    }
  }

  generateColorPalette(characterData) {
    const era = characterData.era;
    const traits = characterData.personalityTraits || [];
    
    // Base palettes by era
    const eraPalettes = {
      victorian: ['#2C3E50', '#8B4513', '#D4AF37', '#696969'],
      gothic: ['#8B0000', '#2F4F4F', '#000000', '#C0C0C0'],
      regency: ['#F5DEB3', '#DDA0DD', '#98FB98', '#87CEEB'],
      medieval: ['#8B4513', '#DAA520', '#228B22', '#4682B4'],
      contemporary: ['#4A90E2', '#7B68EE', '#20B2AA', '#FF6347']
    };
    
    return eraPalettes[era] || eraPalettes.contemporary;
  }

  determineLighting(era) {
    const lightingMap = {
      victorian: 'gaslight',
      gothic: 'candlelight',
      regency: 'natural_daylight',
      medieval: 'firelight',
      renaissance: 'dramatic_contrast',
      contemporary: 'modern_lighting'
    };
    
    return lightingMap[era] || 'natural_daylight';
  }

  determineAtmosphere(traits = []) {
    if (traits.includes('mysterious')) return 'mysterious_fog';
    if (traits.includes('dark') || traits.includes('gothic')) return 'ominous_shadows';
    if (traits.includes('peaceful') || traits.includes('gentle')) return 'pastoral_beauty';
    if (traits.includes('dramatic') || traits.includes('intense')) return 'dramatic_tension';
    return 'balanced_atmosphere';
  }

  async generateAIStoryTemplate(templateData) {
    // Generate story template using AI
    const prompt = `Create a detailed story template for interactive literature with the following specifications:
    
    Template Name: ${templateData.name}
    Description: ${templateData.description}
    Target Audience: ${templateData.targetAudience || 'General'}
    Learning Objectives: ${templateData.learningObjectives?.join(', ') || 'Character understanding'}
    
    Please create:
    1. A structured story outline with 3-7 scenes
    2. Character interaction points and decision moments
    3. Educational assessment opportunities
    4. Adaptability notes for different characters
    5. Expected learning outcomes
    
    Format as a comprehensive template for educators and students.`;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL_CONFIGS.story_generation.model,
        messages: [
          {
            role: 'system',
            content: 'You are an educational content designer specializing in interactive literary experiences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      const aiTemplate = response.choices[0]?.message?.content;
      
      return {
        ...templateData,
        aiGeneratedStructure: aiTemplate,
        scenes: this.extractSceneStructure(aiTemplate),
        assessmentPoints: this.extractAssessmentPoints(aiTemplate),
        learningOutcomes: this.extractLearningOutcomes(aiTemplate)
      };
    } catch (error) {
      console.error('Failed to generate AI story template:', error);
      return templateData;
    }
  }

  extractSceneStructure(aiTemplate) {
    // Extract scene structure from AI response
    // This would parse the AI response to identify scenes and structure
    return [
      { id: 1, title: 'Opening Scene', description: 'Character introduction and setting establishment' },
      { id: 2, title: 'Development', description: 'Character development and conflict introduction' },
      { id: 3, title: 'Resolution', description: 'Character growth and story conclusion' }
    ];
  }

  extractAssessmentPoints(aiTemplate) {
    // Extract assessment opportunities from AI response
    return [
      { scene: 1, type: 'comprehension', description: 'Character understanding check' },
      { scene: 2, type: 'analysis', description: 'Conflict analysis assessment' },
      { scene: 3, type: 'reflection', description: 'Character growth evaluation' }
    ];
  }

  extractLearningOutcomes(aiTemplate) {
    // Extract learning outcomes from AI response
    return [
      'Enhanced character comprehension',
      'Improved literary analysis skills',
      'Deeper understanding of character motivation'
    ];
  }

  async generateAssessmentQuestions(assessmentData, frameworkConfig) {
    // Generate assessment questions based on framework
    const prompt = `Create educational assessment questions for:
    
    Framework: ${frameworkConfig.name}
    Metrics: ${frameworkConfig.metrics.join(', ')}
    Assessment Topic: ${assessmentData.topic || 'Character Analysis'}
    Grade Level: ${assessmentData.gradeLevel || 'Middle School'}
    
    Generate 5-10 questions that assess the specified metrics effectively.
    Include multiple question types: multiple choice, short answer, and essay questions.
    Ensure questions are age-appropriate and educationally sound.`;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL_CONFIGS.educational_content.model,
        messages: [
          {
            role: 'system',
            content: 'You are an educational assessment expert specializing in literature and character analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      const questions = response.choices[0]?.message?.content;
      return this.parseAssessmentQuestions(questions);
    } catch (error) {
      console.error('Failed to generate assessment questions:', error);
      return this.getDefaultQuestions(frameworkConfig);
    }
  }

  parseAssessmentQuestions(questionsText) {
    // Parse AI-generated questions into structured format
    const lines = questionsText.split('\n').filter(line => line.trim());
    const questions = [];
    
    lines.forEach((line, index) => {
      if (line.match(/^\d+\./)) {
        questions.push({
          id: index + 1,
          question: line.replace(/^\d+\.\s*/, ''),
          type: this.detectQuestionType(line),
          points: 10
        });
      }
    });
    
    return questions;
  }

  detectQuestionType(question) {
    if (question.toLowerCase().includes('multiple choice') || question.includes('a)') || question.includes('A)')) {
      return 'multiple_choice';
    }
    if (question.toLowerCase().includes('essay') || question.toLowerCase().includes('explain') || question.toLowerCase().includes('analyze')) {
      return 'essay';
    }
    return 'short_answer';
  }

  getDefaultQuestions(frameworkConfig) {
    // Fallback questions if AI generation fails
    return [
      {
        id: 1,
        question: `How well does the character's behavior align with their established personality?`,
        type: 'short_answer',
        points: 10
      },
      {
        id: 2,
        question: `What evidence from the text supports your character interpretation?`,
        type: 'essay',
        points: 15
      }
    ];
  }

  async generateScoringRubric(frameworkConfig) {
    // Generate scoring rubric for assessment
    return {
      framework: frameworkConfig.name,
      metrics: frameworkConfig.metrics.map(metric => ({
        name: metric,
        levels: [
          { level: 'Excellent', score: 4, description: `Demonstrates exceptional understanding of ${metric}` },
          { level: 'Proficient', score: 3, description: `Shows solid grasp of ${metric}` },
          { level: 'Developing', score: 2, description: `Basic understanding of ${metric}` },
          { level: 'Beginning', score: 1, description: `Limited understanding of ${metric}` }
        ]
      })),
      totalPossible: frameworkConfig.metrics.length * 4
    };
  }

  async validateContent(content, contentType) {
    // Validate content before publishing
    const errors = [];
    
    if (!content.name || content.name.trim().length < 3) {
      errors.push('Name must be at least 3 characters long');
    }
    
    if (contentType === 'character') {
      if (!content.personalityTraits || content.personalityTraits.length === 0) {
        errors.push('Character must have personality traits');
      }
      if (!content.backstory || content.backstory.trim().length < 50) {
        errors.push('Character backstory must be at least 50 characters long');
      }
    }
    
    if (contentType === 'template') {
      if (!content.scenes || content.scenes.length === 0) {
        errors.push('Story template must have at least one scene');
      }
      if (!content.learningObjectives || content.learningObjectives.length === 0) {
        errors.push('Story template must have learning objectives');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Storage methods
  async saveCharacterToStorage(character) {
    try {
      const existingCharacters = await AsyncStorage.getItem('custom_characters');
      const characters = existingCharacters ? JSON.parse(existingCharacters) : [];
      
      // Update or add character
      const index = characters.findIndex(c => c.id === character.id);
      if (index >= 0) {
        characters[index] = character;
      } else {
        characters.push(character);
      }
      
      await AsyncStorage.setItem('custom_characters', JSON.stringify(characters));
    } catch (error) {
      console.error('Failed to save character to storage:', error);
    }
  }

  async saveTemplateToStorage(template) {
    try {
      const existingTemplates = await AsyncStorage.getItem('story_templates');
      const templates = existingTemplates ? JSON.parse(existingTemplates) : [];
      
      const index = templates.findIndex(t => t.id === template.id);
      if (index >= 0) {
        templates[index] = template;
      } else {
        templates.push(template);
      }
      
      await AsyncStorage.setItem('story_templates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save template to storage:', error);
    }
  }

  async saveAssessmentToStorage(assessment) {
    try {
      const existingAssessments = await AsyncStorage.getItem('educational_assessments');
      const assessments = existingAssessments ? JSON.parse(existingAssessments) : [];
      
      const index = assessments.findIndex(a => a.id === assessment.id);
      if (index >= 0) {
        assessments[index] = assessment;
      } else {
        assessments.push(assessment);
      }
      
      await AsyncStorage.setItem('educational_assessments', JSON.stringify(assessments));
    } catch (error) {
      console.error('Failed to save assessment to storage:', error);
    }
  }

  async saveClassroomToStorage(classroom) {
    try {
      const existingClassrooms = await AsyncStorage.getItem('classroom_sessions');
      const classrooms = existingClassrooms ? JSON.parse(existingClassrooms) : [];
      
      const index = classrooms.findIndex(c => c.id === classroom.id);
      if (index >= 0) {
        classrooms[index] = classroom;
      } else {
        classrooms.push(classroom);
      }
      
      await AsyncStorage.setItem('classroom_sessions', JSON.stringify(classrooms));
    } catch (error) {
      console.error('Failed to save classroom to storage:', error);
    }
  }

  async saveCommunityContent(content) {
    try {
      const existingContent = await AsyncStorage.getItem('community_content');
      const communityItems = existingContent ? JSON.parse(existingContent) : [];
      
      const index = communityItems.findIndex(c => c.id === content.id);
      if (index >= 0) {
        communityItems[index] = content;
      } else {
        communityItems.push(content);
      }
      
      await AsyncStorage.setItem('community_content', JSON.stringify(communityItems));
    } catch (error) {
      console.error('Failed to save community content:', error);
    }
  }

  // Getter methods
  getCustomCharacters() {
    return Array.from(this.customCharacters.values());
  }

  getStoryTemplates() {
    return Array.from(this.storyTemplates.values());
  }

  getEducationalAssessments() {
    return Array.from(this.educationalAssessments.values());
  }

  getClassroomSessions() {
    return Array.from(this.classroomSessions.values());
  }

  getCommunityContent() {
    return Array.from(this.communityContent.values());
  }

  // Permission checks
  canCreateCharacters() {
    return this.permissions?.createCharacters || false;
  }

  canCreateStoryTemplates() {
    return this.permissions?.createStoryTemplates || false;
  }

  canAccessAssessments() {
    return this.permissions?.accessAssessments || false;
  }

  canManageClassroom() {
    return this.permissions?.manageClassroom || false;
  }

  canPublishCommunity() {
    return this.permissions?.publishCommunity || false;
  }
}

// Export singleton instance
export const creatorToolsService = new CreatorToolsService();
export default creatorToolsService;