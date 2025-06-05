// AI Service for Dynamic Story Generation
// This service generates scenes, choices, and narrative content based on character personas

const AI_API_URL = 'https://api.openai.com/v1/chat/completions'; // Replace with your preferred AI service
const AI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY; // Store in environment variables

class AIStoryService {
  constructor() {
    this.conversationHistory = [];
    this.currentPersona = null;
    this.sceneCounter = 0;
  }

  // Initialize a new story with character persona
  async startStory(characterPack) {
    this.currentPersona = characterPack.persona;
    this.conversationHistory = [];
    this.sceneCounter = 0;

    const initialPrompt = this.buildInitialPrompt(characterPack);
    
    try {
      const response = await this.generateAIResponse(initialPrompt);
      return this.parseSceneResponse(response);
    } catch (error) {
      console.error('Error starting AI story:', error);
      return this.getFallbackScene(characterPack);
    }
  }

  // Generate next scene based on player choice
  async generateNextScene(choice, currentContext) {
    this.sceneCounter++;
    
    const prompt = this.buildContinuationPrompt(choice, currentContext);
    
    try {
      const response = await this.generateAIResponse(prompt);
      return this.parseSceneResponse(response);
    } catch (error) {
      console.error('Error generating next scene:', error);
      return this.getFallbackScene();
    }
  }

  // Build initial story prompt
  buildInitialPrompt(characterPack) {
    return `You are an interactive fiction narrator creating a story where the player embodies ${characterPack.persona.name}.

CHARACTER PERSONA:
- Name: ${characterPack.persona.name}
- Traits: ${characterPack.persona.traits.join(', ')}
- Worldview: ${characterPack.persona.worldview}
- Setting: ${characterPack.persona.setting}
- Background: ${characterPack.persona.background}
- Speech Style: ${characterPack.persona.speech_style}
- Motivations: ${characterPack.persona.motivations.join(', ')}
- Key Relationships: ${characterPack.persona.relationships.join(', ')}
- Source Material: ${characterPack.persona.canonical_knowledge}

INSTRUCTIONS:
1. Create an opening scene that establishes the character and setting
2. The scene should feel authentic to the source material but allow for player agency
3. Provide 3-4 meaningful choices that reflect different aspects of the character
4. Each choice should have a clear persona impact (positive for in-character, negative for out-of-character)
5. Include vivid descriptions that immerse the player in the world

Respond in this JSON format:
{
  "scene_id": "scene_1",
  "title": "Scene Title",
  "narration": "Detailed scene description and narrative...",
  "ad": null,
  "choices": [
    {
      "choice_id": "1A",
      "text": "Choice description",
      "persona_score": 10,
      "reward_ad": false,
      "next_scene": "scene_2"
    }
  ]
}`;
  }

  // Build continuation prompt based on player choice
  buildContinuationPrompt(choice, currentContext) {
    const historyText = this.conversationHistory.slice(-3).map(h => h.summary).join(' ');
    
    return `Continue the interactive story for ${this.currentPersona.name}.

PREVIOUS CONTEXT: ${historyText}

PLAYER'S LAST CHOICE: "${choice.text}"
PERSONA IMPACT: ${choice.persona_score > 0 ? 'In-character' : 'Out-of-character'} (${choice.persona_score} points)

CURRENT PERSONA SCORE: ${currentContext.personaScore}/100
TOTAL CHOICES MADE: ${currentContext.totalChoicesMade}

INSTRUCTIONS:
1. React to the player's choice naturally within the story world
2. Continue the narrative in a way that feels authentic to ${this.currentPersona.name}
3. Introduce new challenges, characters, or situations
4. Provide 3-4 new choices that test different aspects of the character
5. If persona score is low, perhaps introduce situations where the character can redeem themselves
6. If persona score is high, introduce more challenging moral/character dilemmas

CHARACTER REMINDERS:
- Traits: ${this.currentPersona.traits.join(', ')}
- Motivations: ${this.currentPersona.motivations.join(', ')}
- Setting: ${this.currentPersona.setting}

Respond in the same JSON format as before with scene_id "scene_${this.sceneCounter + 1}".

${this.sceneCounter >= 8 ? 'IMPORTANT: This should be a climactic scene. If appropriate, one choice can lead to "end_summary" to conclude the story.' : ''}`;
  }

  // Call AI API
  async generateAIResponse(prompt) {
    // For demo purposes, return mock data if no API key is provided
    if (!AI_API_KEY) {
      return this.getMockAIResponse(prompt);
    }

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interactive fiction writer specializing in character-driven narratives based on classic literature.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Parse AI response into scene object
  parseSceneResponse(response) {
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const scene = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!scene.scene_id || !scene.narration || !scene.choices) {
        throw new Error('Invalid scene structure');
      }

      // Add to conversation history
      this.conversationHistory.push({
        scene_id: scene.scene_id,
        summary: scene.narration.substring(0, 200) + '...'
      });

      return scene;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackScene();
    }
  }

  // Mock AI response for demo/testing
  getMockAIResponse(prompt) {
    if (prompt.includes('Sherlock Holmes')) {
      return `{
        "scene_id": "scene_${this.sceneCounter + 1}",
        "title": "A Case Begins at Baker Street",
        "narration": "The morning fog drifts through the windows of 221B Baker Street as you sit in your favorite armchair, contemplating the curious case that has just walked through your door. Mrs. Hudson has shown up a distressed young woman, clutching a torn letter. 'Mr. Holmes,' she pleads, 'my brother has vanished, and the police refuse to help. This letter is the only clue.' You examine the paper with your magnifying glass, noting the peculiar watermark and the trembling handwriting.",
        "ad": "Visit Speedy's Café - where even the world's greatest detective stops for a proper cup of tea.",
        "choices": [
          {
            "choice_id": "1A",
            "text": "Observe every detail of the letter and the woman with intense scrutiny, making deductions aloud.",
            "persona_score": 15,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1B", 
            "text": "Offer immediate comfort to the distressed woman before examining the evidence.",
            "persona_score": -5,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1C",
            "text": "Dismiss the case as trivial and suggest she contact the police again.",
            "persona_score": -10,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1D",
            "text": "Accept the case but demand to examine the woman's living quarters for additional clues.",
            "persona_score": 10,
            "reward_ad": true,
            "next_scene": "scene_${this.sceneCounter + 2}"
          }
        ]
      }`;
    }

    if (prompt.includes('Count Dracula')) {
      return `{
        "scene_id": "scene_${this.sceneCounter + 1}",
        "title": "Midnight Visitor at Castle Dracula",
        "narration": "The ancient stones of your castle echo with the footsteps of an unexpected visitor. From your shadowed alcove, you observe a young man stumbling through your courtyard, clearly lost in the Carpathian mountains. His blood calls to you, warm and inviting, yet something about his bearing suggests he may prove... useful. The moon is full, and your powers are at their peak. How do you choose to receive this mortal?",
        "ad": "Discover the finest vintage wines at Transylvanian Cellars - aged to perfection in castle depths.",
        "choices": [
          {
            "choice_id": "1A",
            "text": "Appear as a gracious host, welcoming him with aristocratic charm while concealing your true nature.",
            "persona_score": 15,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1B",
            "text": "Transform into mist and observe him from the shadows to assess his intentions.",
            "persona_score": 10,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1C",
            "text": "Immediately reveal your vampiric nature and attempt to feed.",
            "persona_score": -5,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1D",
            "text": "Send your thrall Renfield to investigate while you prepare an elaborate dinner.",
            "persona_score": 12,
            "reward_ad": true,
            "next_scene": "scene_${this.sceneCounter + 2}"
          }
        ]
      }`;
    }

    if (prompt.includes('Elizabeth Bennet')) {
      return `{
        "scene_id": "scene_${this.sceneCounter + 1}",
        "title": "An Assembly at Meryton",
        "narration": "The assembly rooms at Meryton buzz with excitement as you enter alongside Jane and your younger sisters. The local militia officers have arrived, adding considerable charm to the evening's prospects. You notice Mr. Bingley has brought a friend - a tall, handsome gentleman who surveys the room with an air of disdain. Charlotte Lucas approaches with news: 'Lizzy, that gentleman there is Mr. Darcy of Pemberley - ten thousand a year! Though I hear he is quite proud.' What draws your attention this evening?",
        "ad": "Elegant gloves and bonnets await at Madame Rousseau's - perfect for any country assembly.",
        "choices": [
          {
            "choice_id": "1A",
            "text": "Focus on dancing and conversation, making witty observations about the company.",
            "persona_score": 15,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1B",
            "text": "Approach Mr. Darcy directly to form your own opinion of his character.",
            "persona_score": 8,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1C",
            "text": "Spend the evening gossiping about Mr. Darcy's wealth and status.",
            "persona_score": -8,
            "reward_ad": false,
            "next_scene": "scene_${this.sceneCounter + 2}"
          },
          {
            "choice_id": "1D",
            "text": "Observe everyone quietly to better understand the social dynamics at play.",
            "persona_score": 10,
            "reward_ad": true,
            "next_scene": "scene_${this.sceneCounter + 2}"
          }
        ]
      }`;
    }

    // Generic fallback
    return this.getFallbackSceneJSON();
  }

  // Fallback scene for errors
  getFallbackScene(characterPack = null) {
    const character = characterPack?.character || this.currentPersona?.name || 'the character';
    
    return {
      scene_id: `scene_${this.sceneCounter + 1}`,
      title: "An Unexpected Beginning",
      narration: `You find yourself in the shoes of ${character}, facing a moment that will define your story. The world around you feels both familiar and full of possibilities. What path will you choose?`,
      choices: [
        {
          choice_id: "F1",
          text: "Embrace the role fully and act as the character would.",
          persona_score: 10,
          reward_ad: false,
          next_scene: `scene_${this.sceneCounter + 2}`
        },
        {
          choice_id: "F2", 
          text: "Take a more cautious approach and observe the situation.",
          persona_score: 5,
          reward_ad: false,
          next_scene: `scene_${this.sceneCounter + 2}`
        },
        {
          choice_id: "F3",
          text: "Do something completely unexpected for this character.",
          persona_score: -10,
          reward_ad: false,
          next_scene: `scene_${this.sceneCounter + 2}`
        }
      ]
    };
  }

  getFallbackSceneJSON() {
    return JSON.stringify(this.getFallbackScene());
  }

  // Calculate persona score for a choice
  calculatePersonaScore(choice, characterTraits) {
    // This would be more sophisticated in a real implementation
    // For now, we rely on the AI to provide appropriate scores
    return choice.persona_score || 0;
  }
}

export default new AIStoryService(); 