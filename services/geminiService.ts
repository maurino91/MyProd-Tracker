import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult } from "../types";

export const analyzeProductImage = async (base64Image: string): Promise<ScanResult> => {
  try {
    // Initialize inside the function to ensure env vars are ready
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Analizza questa immagine del prodotto. 
            Estrai:
            1. Il nome del prodotto (Sii conciso).
            2. Il codice a barre o QR se visibile (solo numeri/testo).
            3. La data di scadenza (formato YYYY-MM-DD). Se non è visibile, restituisci null.
            
            Restituisci solo JSON.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nome_prodotto: { type: Type.STRING, description: "Nome del prodotto" },
            codice_ean_qr: { type: Type.STRING, description: "Codice a barre o QR rilevato" },
            data_scadenza: { type: Type.STRING, description: "Data di scadenza in formato YYYY-MM-DD o null se non trovata", nullable: true },
          },
          required: ["nome_prodotto", "codice_ean_qr", "data_scadenza"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as ScanResult;
    return data;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a fallback so the app doesn't crash, allowing manual entry
    return {
      nome_prodotto: "",
      codice_ean_qr: "",
      data_scadenza: null
    };
  }
};