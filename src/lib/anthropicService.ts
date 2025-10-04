import Anthropic from '@anthropic-ai/sdk';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

// Initialize with a default that can be overridden
let anthropic: Anthropic | null = null;

// Auto-initialize if API key is in environment
if (apiKey) {
  anthropic = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // For client-side usage in development
  });
}

export function initializeAnthropic(key?: string) {
  const keyToUse = key || apiKey;
  if (keyToUse) {
    anthropic = new Anthropic({
      apiKey: keyToUse,
      dangerouslyAllowBrowser: true // For client-side usage in development
    });
  }
  return !!anthropic;
}

export interface AIAnalysisResult {
  employeeName: string;
  title: string;
  department: string;
  email: string;
  
  suggestedPerformance: 'low' | 'medium' | 'high';
  suggestedPotential: 'low' | 'medium' | 'high';
  confidence: number;
  
  reasoning: string;
  keyStrengths: string[];
  developmentAreas: string[];
  achievements: string[];
  
  objectives: string[];
  actionItems: Array<{
    description: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  successMetrics: string[];
  
  sonanceSpecificInsights: string[];
  recommendedTimeline: string;
}

export async function analyzeReviewWithAI(reviewText: string): Promise<AIAnalysisResult> {
  if (!anthropic) {
    throw new Error('Anthropic API not initialized. Please provide an API key.');
  }

  const prompt = `You are an expert HR analyst at Sonance, a premium audio company. Analyze this performance review and provide a comprehensive, structured assessment.

PERFORMANCE REVIEW:
${reviewText}

Please analyze this review and provide a JSON response with the following structure:

{
  "employeeName": "extracted full name",
  "title": "job title",
  "department": "department name",
  "email": "email if mentioned",
  
  "suggestedPerformance": "low/medium/high - based on results, goal achievement, quality of work",
  "suggestedPotential": "low/medium/high - based on learning agility, leadership qualities, growth mindset, adaptability",
  "confidence": 85,
  "reasoning": "2-3 sentences explaining the performance and potential assessment",
  
  "keyStrengths": ["3-5 specific strengths mentioned in the review"],
  "developmentAreas": ["3-5 specific areas for improvement"],
  "achievements": ["3-5 key accomplishments"],
  
  "objectives": ["5-7 SMART objectives tailored to this person's role at Sonance and their development areas"],
  "actionItems": [
    {
      "description": "Specific action based on review content",
      "dueDate": "30 days/60 days/90 days",
      "priority": "high/medium/low"
    }
  ],
  "successMetrics": ["5-7 measurable outcomes specific to this employee's goals at Sonance"],
  
  "sonanceSpecificInsights": ["3-4 insights about how this person can contribute to Sonance's mission of premium audio excellence, innovation, or customer experience"],
  "recommendedTimeline": "30 days/60 days/90 days/6 months/12 months"
}

IMPORTANT GUIDELINES:
1. Make objectives and action items SPECIFIC to what was mentioned in the review
2. Reference actual projects, skills, or situations from the review
3. For Sonance-specific insights, relate to: premium audio quality, customer experience, innovation, technical excellence, or brand values
4. Be realistic and actionable - avoid generic advice
5. Confidence score should reflect how clear the performance indicators are (60-95%)
6. Performance ratings: low = below expectations, medium = meets expectations, high = exceeds expectations
7. Potential ratings: low = limited growth, medium = steady growth, high = high growth/leadership potential
8. Return ONLY valid JSON, no other text`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      // Extract JSON from the response
      let jsonText = content.text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const result = JSON.parse(jsonText);
      
      // Validate and return
      return {
        employeeName: result.employeeName || 'Unknown Employee',
        title: result.title || '',
        department: result.department || '',
        email: result.email || '',
        suggestedPerformance: result.suggestedPerformance || 'medium',
        suggestedPotential: result.suggestedPotential || 'medium',
        confidence: result.confidence || 70,
        reasoning: result.reasoning || '',
        keyStrengths: result.keyStrengths || [],
        developmentAreas: result.developmentAreas || [],
        achievements: result.achievements || [],
        objectives: result.objectives || [],
        actionItems: result.actionItems || [],
        successMetrics: result.successMetrics || [],
        sonanceSpecificInsights: result.sonanceSpecificInsights || [],
        recommendedTimeline: result.recommendedTimeline || '90 days'
      };
    }
    
    throw new Error('Unexpected response format from Claude');
  } catch (error: any) {
    console.error('Error analyzing review with AI:', error);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
}

export function isAnthropicConfigured(): boolean {
  return !!anthropic || !!apiKey;
}
