const { OpenAI } = require("openai");
const Deck = require("./model"); // Assumed to be a Mongoose model

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
const MODEL_CONFIG = {
  primary: "gpt-3.5-turbo",
  turbo: "gpt-3.5-turbo", 
  fallback: "gpt-3.5-turbo"
};

// Main chat controller - completely AI-driven
const chatWithAI = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    console.log("💬 User message:", message);

    // Step 1: Let AI completely analyze the request and determine search strategy
    const aiAnalysis = await analyzeCompleteRequest(message, conversationHistory);
    console.log("🤖 Complete AI Analysis:", aiAnalysis);

    let response, decks = [];

    // Step 2: If deck search is needed, let AI determine the MongoDB query
    if (aiAnalysis.requiresDeckSearch) {
      console.log("🔍 AI-driven deck search...");
      
      // Let AI generate the MongoDB query conditions
      const searchQuery = await generateMongoDBSearchQuery(aiAnalysis);
      console.log("📊 MongoDB Query:", searchQuery);
      
      decks = await performAIDrivenSearch(searchQuery);
      
      // Step 3: Let AI generate smart response based on results and user intent
      response = await generateSmartResponse(message, aiAnalysis, decks, conversationHistory);
    } else {
      // Step 3: Generate contextual general response
      response = await generateGeneralResponse(message, aiAnalysis, conversationHistory);
    }

    // Step 4: Send AI-driven response
    res.status(200).json({
      success: true,
      response: response,
      decks: decks.slice(0, 10),
      deckCount: decks.length,
      requiresDeckSearch: aiAnalysis.requiresDeckSearch,
      searchQuery: aiAnalysis.searchQuery,
      userIntent: aiAnalysis.userIntent,
      searchType: aiAnalysis.searchType
    });

  } catch (error) {
    console.error("❌ Chat error:", error);
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        success: false,
        error: "OpenAI API key is invalid or missing"
      });
    }

    res.status(500).json({
      success: false,
      error: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
    });
  }
};

// Complete AI analysis of user request
async function analyzeCompleteRequest(userMessage, conversationHistory) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are an intelligent presentation deck search analyzer. Analyze the user's request completely and determine the best search strategy.

CRITICAL ANALYSIS GUIDELINES:
1. UNDERSTAND USER INTENT:
   - "How many X decks?" = COUNT request across all relevant fields
   - "Find media decks" = Search across industry, type, category, tags
   - "Show me marketing decks" = Focus on deck_type but also check industry/category
   - "Technology industry decks" = Industry-focused search
   - "SEO presentations" = Content/category focused search

2. FIELD MAPPING INTELLIGENCE:
   - INDUSTRY: "finance", "technology", "healthcare", "media", "automotive", "retail"
   - DECK_TYPE: "marketing", "sales", "seo", "business", "media", "pitch", "strategy"
   - CATEGORY: "presentation", "template", "pitch", "report", "analysis"
   - TAGS: specific topics, technologies, methods

3. SMART INTERPRETATION:
   - "Media decks" = Search ALL: industry=media + deck_type=media + tags=media
   - "Marketing decks" = Search: deck_type=marketing + category=marketing + tags=marketing
   - "Technology decks" = Search BOTH: industry=technology AND deck_type=technology
   - Count requests = BROAD search across multiple relevant fields

4. RESPONSE TYPE:
   - counting: User wants numbers/statistics
   - browsing: User wants to see examples
   - specific: User wants particular content
   - exploratory: User is discovering

Respond with EXACT JSON format:
{
  "requiresDeckSearch": boolean,
  "searchQuery": string (optimized search terms),
  "userIntent": string (detailed description of what user wants),
  "searchType": "all_decks" | "specific_search" | "industry_specific" | "category_specific" | "type_specific" | "multi_field" | "count_request",
  "isGenericRequest": boolean,
  "correctedQuery": string (if user has terminology issues),
  "confidence": number (0.0-1.0),
  "expectedFields": string[] (which database fields to search),
  "responseType": "counting" | "browsing" | "specific" | "exploratory",
  "searchScope": "broad" | "narrow" | "exact"
}`
      }
    ];

    // Add conversation context
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-3).map(entry => 
        `${entry.role}: ${entry.message}`
      ).join('\n');
      
      messages.push({
        role: "system",
        content: `Recent conversation history:\n${recentHistory}`
      });
    }

    messages.push({
      role: "user",
      content: `Analyze this deck search request: "${userMessage}"`
    });

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary,
      messages: messages,
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    console.log("🔍 AI Analysis Result:", analysis);
    return analysis;

  } catch (error) {
    console.error("Error in AI analysis:", error);
    return smartFallbackAnalysis(userMessage);
  }
}

// AI generates MongoDB search query based on analysis
async function generateMongoDBSearchQuery(analysis) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a SMART MongoDB query generator for a presentation deck database.

DATABASE FIELDS:
- title: string (deck title)
- description: string (deck description)
- deck_type: string (Marketing, Sales, SEO, Business, Media, Pitch, Strategy, Financial, Technical)
- category: string (Presentation, Template, Report, Analysis, Proposal, Plan)
- industry: string (Technology, Healthcare, Finance, Media, Automotive, Retail, Education)
- tags: string[] (specific topics, methods, technologies)
- uploaded_by: string
- uploaded_at: date

INTELLIGENT SEARCH STRATEGIES:

1. COUNT REQUESTS ("how many media decks"):
   - BROAD search across industry, deck_type, category, tags
   - Use $or conditions to catch all relevant decks

2. SPECIFIC TYPE REQUESTS ("marketing decks"):
   - PRIMARY: deck_type field
   - SECONDARY: category, tags, title

3. INDUSTRY REQUESTS ("technology industry decks"):
   - PRIMARY: industry field  
   - SECONDARY: tags, description

4. CONTENT REQUESTS ("SEO presentations"):
   - PRIMARY: deck_type, category
   - SECONDARY: tags, title, description

5. MULTI-FIELD REQUESTS ("media decks"):
   - Search ACROSS: industry, deck_type, category, tags
   - Use $or with multiple conditions

6. EXPLORATORY REQUESTS ("show me some decks"):
   - Return recent decks across all types
   - Apply light filtering if context exists

SPECIAL CASES:
- "media" = search industry:"Media" OR deck_type:"Media" OR tags:"media"
- "marketing" = search deck_type:"Marketing" OR category:"Marketing" OR tags:"marketing"
- "technology" = search industry:"Technology" OR deck_type:"Technical" OR tags:"technology"

Respond with EXACT JSON format:
{
  "searchConditions": object (MongoDB query conditions),
  "searchFields": string[] (fields being searched),
  "explanation": string (search strategy explanation),
  "sortOrder": object (sort criteria),
  "searchStrategy": "broad" | "focused" | "exact",
  "resultLimit": number (how many results to return)
}`
      },
      {
        role: "user",
        content: `Generate SMART search query for:
Original Query: "${analysis.searchQuery}"
Search Type: ${analysis.searchType}
User Intent: ${analysis.userIntent}
Response Type: ${analysis.responseType}
Search Scope: ${analysis.searchScope}
Expected Fields: ${analysis.expectedFields ? analysis.expectedFields.join(', ') : 'all'}

Create the most appropriate MongoDB search conditions.`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary,
      messages: messages,
      max_tokens: 600,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const queryPlan = JSON.parse(completion.choices[0].message.content);
    console.log("📊 AI Query Plan:", queryPlan);
    return queryPlan;

  } catch (error) {
    console.error("Error generating MongoDB query:", error);
    return generateSmartFallbackQuery(analysis);
  }
}

// Perform AI-driven search
async function performAIDrivenSearch(queryPlan) {
  try {
    console.log("🔍 Executing AI-planned search...");
    
    let decks = [];
    
    // Build the MongoDB query
    let mongoQuery = Deck.find(queryPlan.searchConditions || {});
    
    // Apply sorting
    if (queryPlan.sortOrder && Object.keys(queryPlan.sortOrder).length > 0) {
      mongoQuery = mongoQuery.sort(queryPlan.sortOrder);
    } else {
      mongoQuery = mongoQuery.sort({ uploaded_at: -1 }); // Default: newest first
    }
    
    // Apply limit
    const limit = queryPlan.resultLimit || 50;
    
    // Execute query - select all relevant fields
    decks = await mongoQuery
      .limit(limit)
      .select('title deck_type category industry uploaded_by uploaded_at description tags rating _id file_name');
    
    console.log(`📊 Found ${decks.length} decks with AI-planned search`);
    
    // Let AI rank and filter if we have many results
    if (decks.length > 15) {
      decks = await rankDecksWithAI(decks, queryPlan);
    }
    
    return decks;

  } catch (error) {
    console.error("Error in AI-driven search:", error);
    return [];
  }
}

// AI-powered deck ranking
async function rankDecksWithAI(decks, queryPlan) {
  try {
    if (decks.length <= 15) return decks;

    const messages = [
      {
        role: "system",
        content: `You are a relevance ranking system for presentation decks. Rank decks based on search intent.

Return a JSON object with a single key "rankedIds" containing an array of deck IDs in relevance order (most relevant first): {"rankedIds": ["id1", "id2", ...]}`
      },
      {
        role: "user",
        content: `Search Context: ${queryPlan.explanation}
Search Strategy: ${queryPlan.searchStrategy}

Decks to rank:
${decks.map(deck => 
  `${deck._id} | ${deck.title} | Type:${deck.deck_type || 'N/A'} | Industry:${deck.industry || 'N/A'} | Category:${deck.category || 'N/A'}`
).join('\n')}`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.1,
      // Enforce JSON object output for reliable parsing
      response_format: { type: "json_object" } 
    });

    const responseContent = completion.choices[0].message.content.trim();
    
    // Parse the JSON object
    const rankingResult = JSON.parse(responseContent);
    const rankedIds = rankingResult.rankedIds || [];

    // Reorder decks based on AI ranking
    const deckMap = new Map(decks.map(deck => [deck._id.toString(), deck]));
    const rankedDecks = rankedIds
      .map(id => deckMap.get(id))
      .filter(deck => deck !== undefined);
    
    // Add unranked decks
    const unrankedDecks = decks.filter(deck => !rankedIds.includes(deck._id.toString()));
    
    return [...rankedDecks, ...unrankedDecks];

  } catch (error) {
    console.error("Error in AI ranking:", error);
    return decks;
  }
}

// Smart response generation
async function generateSmartResponse(userMessage, analysis, decks, conversationHistory) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a intelligent presentation deck assistant. Generate SMART responses based on search results and user intent.

RESPONSE STRATEGIES:

1. COUNTING RESPONSES ("how many media decks"):
   - Start with the total count
   - Break down by types/industries if relevant
   - Offer to show details if user wants

2. BROWSE RESPONSES ("show me marketing decks"):
   - Mention what you found
   - Highlight interesting types/categories
   - Show sample decks
   - Suggest related searches

3. SPECIFIC RESPONSES ("find SEO strategy decks"):
   - Be precise about matches
   - Mention relevance
   - Offer alternatives if few results

4. EXPLORATORY RESPONSES ("what decks are available"):
   - Show variety
   - Highlight popular categories
   - Guide to more specific searches

KEY PRINCIPLES:
- Be accurate about numbers and types
- Don't make up deck details
- Suggest related searches when helpful
- Admit limitations honestly
- Be conversational but informative`
      }
    ];

    // Add conversation context
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-3).map(entry => 
        `${entry.role}: ${entry.message}`
      ).join('\n');
      
      messages.push({
        role: "system",
        content: `Conversation context:\n${recentHistory}`
      });
    }

    // Build comprehensive results context
    let resultsContext = `User asked: "${userMessage}"\n`;
    resultsContext += `Search intent: ${analysis.userIntent}\n`;
    resultsContext += `Found ${decks.length} decks\n`;
    
    if (decks.length > 0) {
      // Analyze deck composition
      const deckTypes = [...new Set(decks.map(deck => deck.deck_type).filter(Boolean))];
      const categories = [...new Set(decks.map(deck => deck.category).filter(Boolean))];
      const industries = [...new Set(decks.map(deck => deck.industry).filter(Boolean))];
      
      resultsContext += `Deck types: ${deckTypes.length > 0 ? deckTypes.join(', ') : 'Various'}\n`;
      if (categories.length > 0) resultsContext += `Categories: ${categories.join(', ')}\n`;
      if (industries.length > 0) resultsContext += `Industries: ${industries.join(', ')}\n`;
      
      // Top decks for context
      resultsContext += `Sample decks (top ${Math.min(5, decks.length)}):\n`;
      decks.slice(0, 5).forEach((deck, index) => {
        resultsContext += `${index + 1}. "${deck.title}" - Type:${deck.deck_type || 'General'}`;
        if (deck.industry) resultsContext += ` - Industry:${deck.industry}`;
        if (deck.category) resultsContext += ` - Category:${deck.category}`;
        resultsContext += '\n';
      });
    } else {
      resultsContext += `No decks found matching the search criteria.\n`;
    }

    messages.push({
      role: "user",
      content: `Generate a smart, helpful response about these deck search results:\n\n${resultsContext}\n\nUser's original question: "${userMessage}"`
    });

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary,
      messages: messages,
      max_tokens: 400,
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();

  } catch (error) {
    console.error("Error generating smart response:", error);
    return generateSmartFallbackResponse(decks, analysis, userMessage);
  }
}

// General response function (for non-search conversations)
async function generateGeneralResponse(userMessage, analysis, conversationHistory) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant for a presentation deck platform. Help users with:
- General questions about presentations, decks, or the platform
- How to use the search functionality
- Tips for creating good presentations
- Platform features and capabilities

Keep responses friendly, concise, and helpful. Guide users to effective deck searches.`
      }
    ];

    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-3).map(entry => 
        `${entry.role}: ${entry.message}`
      ).join('\n');
      
      messages.push({
        role: "system",
        content: `Conversation context:\n${recentHistory}`
      });
    }

    messages.push({
      role: "user",
      content: userMessage
    });

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary,
      messages: messages,
      max_tokens: 300,
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();

  } catch (error) {
    console.error("Error generating general response:", error);
    return "I'm here to help you find presentation decks or answer questions about our platform. How can I assist you today?";
  }
}

// Smart fallback functions
function smartFallbackAnalysis(message) {
  const lowerMessage = message.toLowerCase();
  
  // Detect count requests
  const isCountRequest = /how many|number of|count of/i.test(message);
  
  // Detect search intent
  const requiresDeckSearch = /(deck|presentation|slide|pitch|template|ppt|powerpoint|show me|find|search)/i.test(message);
  
  let searchType = "specific_search";
  let responseType = "browsing";
  let searchScope = "narrow";
  
  if (isCountRequest) {
    searchType = "count_request";
    responseType = "counting";
    searchScope = "broad";
  } else if (lowerMessage.includes('all') || lowerMessage.includes('every')) {
    searchType = "all_decks";
    searchScope = "broad";
  }
  
  // Extract search terms
  const searchQuery = message.replace(/(how many|number of|count of|decks|presentations|slides)/gi, '').trim();
  
  return {
    requiresDeckSearch,
    searchQuery: searchQuery || message,
    userIntent: isCountRequest ? `Counting ${searchQuery || 'relevant'} decks` : `Searching for ${searchQuery || 'presentation decks'}`,
    searchType: searchType,
    isGenericRequest: true,
    correctedQuery: "",
    confidence: 0.7,
    expectedFields: ["title", "description", "deck_type", "category", "industry", "tags"],
    responseType: responseType,
    searchScope: searchScope
  };
}

function generateSmartFallbackQuery(analysis) {
  const searchTerms = analysis.searchQuery.toLowerCase().split(' ')
    .filter(term => term.length > 2)
    .filter(term => !['the', 'and', 'for', 'with', 'about', 'decks', 'presentations', 'slides'].includes(term));

  if (searchTerms.length === 0 || analysis.searchType === "all_decks") {
    return { 
      searchConditions: {}, 
      searchFields: ["title", "deck_type", "category", "industry", "tags"],
      explanation: "Returning all decks for browsing",
      sortOrder: { uploaded_at: -1 },
      searchStrategy: "broad",
      resultLimit: 50
    };
  }

  // For count requests, use broader search
  if (analysis.responseType === "counting") {
    const orConditions = searchTerms.map(term => ({
      $or: [
        { deck_type: { $regex: term, $options: 'i' } },
        { industry: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
        { tags: { $regex: term, $options: 'i' } },
        { title: { $regex: term, $options: 'i' } }
      ]
    }));

    return {
      searchConditions: { $or: orConditions.flatMap(cond => cond.$or) },
      searchFields: ['deck_type', 'industry', 'category', 'tags', 'title'],
      explanation: `Broad search for counting ${searchTerms.join(', ')} related decks`,
      sortOrder: {},
      searchStrategy: "broad",
      resultLimit: 1000
    };
  }

  // For specific searches, use focused approach
  const orConditions = searchTerms.map(term => ({
    $or: [
      { deck_type: { $regex: term, $options: 'i' } },
      { title: { $regex: term, $options: 'i' } },
      { industry: { $regex: term, $options: 'i' } },
      { category: { $regex: term, $options: 'i' } }
    ]
  }));

  return {
    searchConditions: { $or: orConditions.flatMap(cond => cond.$or) },
    searchFields: ['deck_type', 'title', 'industry', 'category'],
    explanation: `Focused search for ${searchTerms.join(', ')}`,
    sortOrder: { uploaded_at: -1 },
    searchStrategy: "focused",
    resultLimit: 25
  };
}

function generateSmartFallbackResponse(decks, analysis, userMessage) {
  if (decks.length === 0) {
    return `I searched but couldn't find any decks matching "${analysis.searchQuery}". You might try:\n- Different search terms\n- Broader categories (marketing, sales, business)\n- Specific industries (technology, finance, healthcare)`;
  }

  if (analysis.responseType === "counting") {
    const deckTypes = [...new Set(decks.map(deck => deck.deck_type).filter(Boolean))];
    const typeBreakdown = deckTypes.length > 0 ? 
      ` They include ${deckTypes.slice(0, 3).join(', ')} decks.` : '';
    
    return `I found ${decks.length} decks related to "${analysis.searchQuery}".${typeBreakdown}`;
  }

  if (decks.length === 1) {
    // CRITICAL FIX: The incorrect template literal syntax was here
    return `I found one deck matching your search: "${decks[0].title}" (${decks[0].deck_type || 'General'}).`;
  }

  const categories = [...new Set(decks.map(deck => deck.deck_type).filter(Boolean))].slice(0, 3);
  const categoryText = categories.length > 0 ? 
    ` These include ${categories.join(', ')} presentations.` : '';

  return `I found ${decks.length} decks for "${analysis.searchQuery}"!${categoryText} Here are some examples:`;
}

// Additional endpoints (unchanged but included for completeness)
const getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Query parameter is required"
      });
    }

    const messages = [
      {
        role: "system",
        content: `You are a search suggestion assistant for a presentation deck platform. Generate 5-8 helpful search suggestions based on the user's partial query.

Consider:
- Common deck types (marketing, sales, SEO, business plan, pitch)
- Industries (technology, healthcare, finance)
- Categories (strategy, template, analysis)
- Keep suggestions practical and useful

Return ONLY a JSON array of strings: ["suggestion1", "suggestion2", ...]`
      },
      {
        role: "user",
        content: `Generate search suggestions for: "${query}"`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary,
      messages: messages,
      max_tokens: 200,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Parsing expects a JSON object which might contain the array under a key
    const response = JSON.parse(completion.choices[0].message.content);
    const suggestions = Array.isArray(response) ? response : 
                      response.suggestions || response.results || [];

    res.status(200).json({
      success: true,
      suggestions: suggestions.slice(0, 8),
      originalQuery: query
    });

  } catch (error) {
    console.error("Error generating search suggestions:", error);
    res.status(200).json({
      success: true,
      suggestions: [
        "marketing decks",
        "sales presentations", 
        "business plan templates",
        "pitch decks",
        "SEO strategy presentations"
      ],
      originalQuery: req.query.query
    });
  }
};

const getConversationAnalytics = async (req, res) => {
  try {
    const { conversationHistory } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({
        success: false,
        error: "Conversation history is required"
      });
    }

    const messages = [
      {
        role: "system",
        content: `Analyze the conversation history and provide insights about the user's preferences and behavior.

Respond with JSON:
{
  "topInterests": string[],
  "preferredDeckTypes": string[],
  "commonThemes": string[],
  "engagementLevel": "high" | "medium" | "low",
  "suggestedNextSearches": string[]
}`
      },
      {
        role: "user",
        content: `Analyze this conversation history: ${JSON.stringify(conversationHistory.slice(-10))}`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary,
      messages: messages,
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analytics = JSON.parse(completion.choices[0].message.content);

    res.status(200).json({
      success: true,
      analytics: analytics,
      conversationLength: conversationHistory.length
    });

  } catch (error) {
    console.error("Error analyzing conversation:", error);
    res.status(200).json({
      success: true,
      analytics: {
        topInterests: ["presentation decks"],
        preferredDeckTypes: [],
        commonThemes: [],
        engagementLevel: "medium",
        suggestedNextSearches: ["business presentations", "marketing decks", "sales templates"]
      },
      conversationLength: conversationHistory.length
    });
  }
};

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    // Test OpenAI connection with a simple completion
    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary,
      messages: [{ role: "user", content: "Say 'OK' if working." }],
      max_tokens: 5,
    });

    res.status(200).json({
      success: true,
      message: "AI service is operational",
      openaiStatus: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "AI service is experiencing issues",
      openaiStatus: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  chatWithAI,
  getSearchSuggestions,
  getConversationAnalytics,
  healthCheck
};