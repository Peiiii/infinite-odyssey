import { GoogleGenAI, Type } from "@google/genai";
import { WorldConfig, ParticleType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the narrator of an immersive, text-based visual exploration game called "Infinite Odyssey".
Your goal is to take the user on a journey through a specific world.
Your tone should adapt to the world settings (e.g., eerie for horror, wondrous for fantasy, clinical for sci-fi).
Keep descriptions concise (under 80 words) but highly visual and evocative.
`;

// 1. Initialize a new world based on user prompt
export const initializeWorld = async (userPrompt: string): Promise<{ 
    worldConfig: WorldConfig; 
    initialLocation: string; 
    initialDescription: string; 
}> => {
    try {
        const prompt = `
            The user wants to explore a world described as: "${userPrompt}".
            
            Create a coherent world setting.
            1. Give it a cool, short title (e.g., "Neon Tokyo", "The Candy Kingdom", "Mars Base Alpha").
            2. Define a consistent visual style string for image generation (e.g., "Cyberpunk, neon lights, rain, high contrast", "Whimsical, pastel colors, 3d render").
            3. Choose the most appropriate particle atmospheric effect from this list: ['bubbles', 'dust', 'embers', 'snow', 'rain', 'space', 'none'].
            4. Define the starting location name.
            5. Provide an opening description of this location.

            Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        worldTitle: { type: Type.STRING },
                        visualStyle: { type: Type.STRING },
                        particleEffect: { type: Type.STRING, enum: ['bubbles', 'dust', 'embers', 'snow', 'rain', 'space', 'none'] },
                        initialLocation: { type: Type.STRING },
                        initialDescription: { type: Type.STRING }
                    },
                    required: ['worldTitle', 'visualStyle', 'particleEffect', 'initialLocation', 'initialDescription']
                }
            }
        });

        const data = JSON.parse(response.text || "{}");
        return {
            worldConfig: {
                worldTitle: data.worldTitle,
                visualStyle: data.visualStyle,
                particleEffect: data.particleEffect as ParticleType
            },
            initialLocation: data.initialLocation,
            initialDescription: data.initialDescription
        };
    } catch (e) {
        console.error("Init World Error", e);
        // Fallback
        return {
            worldConfig: {
                worldTitle: "Unknown Realm",
                visualStyle: "Cinematic, mysterious, atmospheric",
                particleEffect: 'dust'
            },
            initialLocation: "The Void",
            initialDescription: "You stand in a place that is no place. Shapes form and dissolve in the mist."
        };
    }
};

// 2. Generate next scene
export const generateSceneDescription = async (
  userPrompt: string, 
  currentLocationTitle: string,
  worldConfig: WorldConfig,
  currentImageBase64: string | null
): Promise<{ title: string; description: string }> => {
  try {
    const textPrompt = `
      World Context: ${worldConfig.worldTitle}.
      Visual Style: ${worldConfig.visualStyle}.
      Current Location: ${currentLocationTitle}.
      User Action/Query: "${userPrompt}".
      
      Based on the visual context (if provided) and the user's action:
      1. Determine where the user goes next.
      2. Maintain object permanence (if they look at something specific in the image).
      3. Keep the tone consistent with the world.
      
      Generate a JSON response with:
      1. A short title for the new location/scene.
      2. A vivid description (max 80 words).
    `;

    const parts: any[] = [{ text: textPrompt }];

    if (currentImageBase64) {
        const base64Data = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
            }
        });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['title', 'description']
        }
      }
    });

    return JSON.parse(response.text || "{}");

  } catch (error) {
    console.error("Error generating description:", error);
    return {
      title: "Lost",
      description: "The path forward is unclear. The world seems to shift around you."
    };
  }
};

// 3. Generate Image with Style
export const generateSceneImage = async (description: string, worldConfig: WorldConfig): Promise<string | null> => {
  try {
    const prompt = `
      ${worldConfig.visualStyle}.
      Scene: ${description}. 
      High quality, detailed, cinematic lighting, 8k resolution.
    `;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;

  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export const generateNarratorSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Fenrir' },
              },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return null;

      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
      return audioBuffer;

  } catch (e) {
      console.error("TTS Error", e);
      return null;
  }
}