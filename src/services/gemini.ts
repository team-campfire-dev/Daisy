import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchGooglePlaces, GooglePlace } from '@/lib/googlePlaces';
import { getWalkingRoute } from '@/lib/tmap';

import { findNearbyPlaces, upsertGooglePlace } from './placeService';


const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface PlaceDetail {
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  reviews?: string[];
  openingHours?: string;
  bookingUrl?: string; // Google Maps URL usually
  googlePlaceId?: string;
}

export interface AccommodationDetail extends PlaceDetail {
  checkIn?: string;
  checkOut?: string;
  amenities?: string[];
}

export interface CourseStep {
  placeName: string;
  category: "Meal" | "Cafe" | "Activity" | "Accommodation";
  description: string;
  duration: string;
  location: { lat: number; lng: number };
  distanceFromPrev?: string;
  timeFromPrev?: string;
  pathToNext?: { lat: number; lng: number }[];
  detail?: PlaceDetail | AccommodationDetail;
}

export interface CoursePlan {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  transportation: "car" | "public" | "walk";
  steps: CourseStep[];
  totalDistance?: string;
  parkingInfo?: string; // NEW: Parking info for the whole course or specific spots
}

export interface CourseResponse {
  conversationResponse: string;
  plans?: CoursePlan[];
  suggestedReplies?: string[];
}

export interface HistoryMessage {
  role: string;
  content: string;
}

export async function generateDateCourse(
  userMessage: string,
  history: HistoryMessage[] = [],
  systemContext: string = "",
  transportMode: "car" | "public" | "walk" = "public"
): Promise<CourseResponse> {
  // 1. First Greeting Handler
  if (userMessage === "HELLO_DAISY") {
    return {
      conversationResponse: "안녕하세요! 데이지입니다. 🌼\n오늘 데이트는 어느 지역에서 하실 계획인가요?",
      plans: [],
      suggestedReplies: ["강남", "홍대", "성수", "이태원"]
    };
  }

  // 2. Intent Detection Logic (Moved Up)
  const isPlanningRequest = userMessage.includes("계획") ||
    userMessage.includes("추천") ||
    userMessage.includes("코스") ||
    userMessage.includes("짜줘") ||
    userMessage.includes("루트") ||
    userMessage === "PLAN_NOW";

  // Dynamic Model Selection
  // Complex Planning -> Flash
  // Simple Chat -> Flash-Lite
  const modelName = isPlanningRequest ? 'gemini-2.5-flash' : 'gemini-2.5-flash-lite';
  console.log(`[Gemini] Using model: ${modelName} (Intent: ${isPlanningRequest ? 'Planning' : 'Chat'})`);

  const model = genAI.getGenerativeModel({ model: modelName });

  const historyText = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');

  let searchContext = "";
  let candidatePlaces: GooglePlace[] = [];




  if (isPlanningRequest) {
    console.log("Planning request detected. Generating Google Search queries...");

    // Smart Query Generation
    const queryPrompt = `
            The user wants a complete date course. 
            Analyze the CONVERSATION HISTORY and SYSTEM CONTEXT.
            Determine the Target Region (e.g. Gangnam, Hongdae). If not found, infer from user message.
            
            CRITICAL INSTRUCTION:
            If the user explicitly mentions specific place names (e.g., "I want to go to [Place Name]"), 
            YOU MUST include that specific place name as one of the search queries to ensure it is found.
            
            Generate 4-5 Google Maps Search Queries to split across:
            1. **Specific Requested Places** (Priority 1)
            2. Restaurant (Meal)
            3. Cafe
            4. Activity (e.g. Workshop, Walk, Exhibition)
            
            System Context: ${systemContext}
            Conversation History:
            ${historyText}
            Current Message: "${userMessage}"
            
            Return JSON ARRAY of strings only. Example: ["Yeonnam Toma Main Branch", "Sinseon Hwaro", "Hongdae quiet cafe"]
        `;

    try {
      const result = await model.generateContent(queryPrompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const queries = JSON.parse(text) as string[];

      console.log("Search Queries:", queries);

      // Execute Searches (Parallel)
      // Limit to 3 results per query to save tokens/latency
      const searchPromises = queries.map(q => searchGooglePlaces(q, 3));
      const searchResults = await Promise.all(searchPromises);

      // Flatten and Deduplicate by Place ID
      const flattened = searchResults.flat();
      const uniqueMap = new Map<string, GooglePlace>();
      flattened.forEach(item => uniqueMap.set(item.placeId, item));

      // [NEW] Persist all found Google Places to DB
      console.log(`[Gemini] Persisting ${uniqueMap.size} Google Places to DB...`);
      for (const place of uniqueMap.values()) {
        await upsertGooglePlace(place);
      }

      // 2. Augment with DB Results
      // Use the first valid result as "Anchor" to find nearby cached places
      if (flattened.length > 0) {
        const anchor = flattened[0];
        try {
          // Radius: 2km default
          const cached = await findNearbyPlaces(anchor.location.lat, anchor.location.lng, 2000, 50);
          console.log(`[Gemini] Found ${cached.length} cached places nearby.`);

          cached.forEach((p: any) => {
            if (!uniqueMap.has(p.id)) {
              // Map DB Place to GooglePlace
              uniqueMap.set(p.id, {
                placeId: p.id,
                title: p.title,
                address: p.address,
                location: { lat: p.lat, lng: p.lng },
                rating: p.rating ?? undefined,
                userRatingCount: p.userRatingCount ?? undefined,
                category: p.category ?? undefined,
                photoUrl: p.photoUrl ?? undefined,
                openNow: p.openNow ?? undefined,
                website: p.website ?? undefined
              });
            }
          });
        } catch (dbErr) {
          console.error("[Gemini] DB Search Error:", dbErr);
        }
      } else {
        // Fallback: If no google results, maybe try text search in DB? 
        // Or if we parsed a region name, we could search DB by region (not implemented yet).
      }

      candidatePlaces = Array.from(uniqueMap.values());

      // 3. Distance Filtering (Optional but recommended)
      // If mode is walk, maybe filter strictly? Let's just sort or rely on Prompt for now.
      // But user asked for "must consider travel distance".
      // We will provide distance info to the prompt? Or just ensure we only pass nearby places.
      // We already filtered DB results by 2km. Google results usually are relevant.
      // We will PASS "candidates" to the prompt, and relying on Gemini to pick logically connected ones?
      // Better: We explicitly calculate distance between candidates if needed, but that's O(N^2).
      // Let's trust Gemini with the provided list which is spatially clustered.

      // Format for Prompt
      // STRICTLY PASS ONLY REAL DATA
      searchContext = `
            AVAILABLE REAL PLACES (You MUST choose from this list for the plans):
            ${JSON.stringify(candidatePlaces.map(p => ({
        id: p.placeId,
        title: p.title,
        category: p.category,
        rating: p.rating,
        count: p.userRatingCount,
        address: p.address,
        location: p.location, // {lat, lng}
        openNow: p.openNow,
        photo: p.photoUrl ? "Available" : "None"
      })), null, 2)}
            `;

    } catch (e) {
      console.error("Search Step Failed:", e);
      // If search fails, we might fall back to general knowledge, but we prefer not to.
      searchContext = "Search failed. Try to recommend famous places if possible, but warn the user.";
    }
  }

  // 3. Final Planning & Chat Logic
  // 3. Final Planning & Chat Logic
  const prompt = `
        You are "Daisy" (데이지), a Date Course Planner AI.
        
        CONTEXT:
        - System: ${systemContext}
        - Transport: ${transportMode} (Even if this is 'car', the map path will be walking, but 'parkingInfo' is needed).
        - User: ${userMessage}
        - Intent: ${isPlanningRequest ? "GENERATE_PLAN" : "CHAT_ONLY"}
        
        SEARCH RESULTS:
        ${searchContext}

        INSTRUCTIONS:
        1. **CHAT ONLY**: If Intent is CHAT_ONLY, answer the user warmly but VERY concisely. Maximum 2 sentences. No repetitive greetings. **Ask a direct question to guide the user's next step.**
        2. **GENERATE PLAN**:
           - If user wants a plan, generate 3 distinct options (Plan A, B, C).
           - **Not necessary, but important**: The generated plans must avoid **OVERLAPPING** in their main places (Restaurants, Cafes, Activity Spots). VALIDATE that Plan B does not use places from Plan A, and Plan C does not use places from A or B.
           - **Flexible Length**: Each plan should have **3 to 6 steps** based on the flow (e.g. Meal->Cafe->Walk->Detail).
           - **Specific Request**: If user asked for "Peach Pudding", YOU MUST INCLUDE IT if found in Search Results.
           - **Data**: USE ONLY Real Data from Search Results.
           - **Parking**: Include 'parkingInfo' if Transport is 'car'.
           - **Language**: Korean.
           
        Response Format (JSON):
        {
          "conversationResponse": "Concise (1-2 sentences) Korean response ending with a direct question.",
          "suggestedReplies": ["Keyword 1", "Keyword 2", "Keyword 3"], // Simple, clear keywords (e.g. "Gangnam", "Italian", "Quiet")
          "plans": [
            {
              "id": "A",
              "title": "Title",
              "description": "Summary",
              "totalDuration": "Estimate",
              "transportation": "${transportMode}",
              "parkingInfo": "Parking tips...",
              "steps": [
                 { "placeName": "...", "category": "...", "description": "...", "duration": "...", "location": { "lat": 0, "lng": 0 }, "detail": { "googlePlaceId": "..." } }
              ]
            }
          ]
        }
    `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    const jsonStr = cleanedText.substring(firstBrace, lastBrace + 1);

    const responseData = JSON.parse(jsonStr) as CourseResponse;

    // 4. Post-Processing: Enrich & Route Calculation
    if (responseData.plans && responseData.plans.length > 0) {
      for (const plan of responseData.plans) {

        // Enrich Data
        for (const step of plan.steps) {
          if (step.detail?.googlePlaceId) {
            const original = candidatePlaces.find(p => p.placeId === step.detail!.googlePlaceId);
            if (original) {
              step.detail.imageUrl = original.photoUrl;
              step.detail.rating = original.rating;
              step.detail.reviewCount = original.userRatingCount;
              // Overwrite location to ensure precision
              step.location = original.location;
            }
          }
        }

        // Calculate Routes - Uses TMap (Walking) -> Fallback to Kakao (Car) -> Straight Line
        for (let i = 0; i < plan.steps.length - 1; i++) {
          const from = plan.steps[i].location;
          const to = plan.steps[i + 1].location;


          if (from.lat && to.lat) {
            // 1. Try TMap Walking Route
            let routeResult = await getWalkingRoute(from, to);



            if (routeResult) {
              // routeResult is RouteInfo
              const durationSeconds = routeResult.duration;

              plan.steps[i + 1].distanceFromPrev = `${(routeResult.distance / 1000).toFixed(1)}km`;
              plan.steps[i + 1].timeFromPrev = `${Math.ceil(durationSeconds / 60)}분`;

              if (routeResult.path && routeResult.path.length > 0) {
                plan.steps[i].pathToNext = routeResult.path;
              }
            } else {
              // 3. Fallback to straight line
              plan.steps[i].pathToNext = [from, to];
            }
          }
        }
      }
    }

    return responseData;

  } catch (error) {
    console.error('Gemini Error:', error);
    return {
      conversationResponse: "죄송합니다. 처리 중 오류가 발생했습니다.",
      plans: [],
      suggestedReplies: ["다시 시도"]
    };
  }
}
