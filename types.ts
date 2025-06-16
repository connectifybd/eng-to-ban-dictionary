
export interface TranslationEntry {
  englishWord: string;
  bengaliWord: string;
  partOfSpeech: string;
  pronunciation?: string; 
  englishExample?: string;
  bengaliExample?: string;
  synonyms?: string[]; // Added for synonyms
  antonyms?: string[]; // Added for antonyms
}

export interface GeminiTranslationResponse {
  translations: TranslationEntry[];
}
