/**
 * Menganalisis data hasil laboratorium menggunakan model OpenRouter.
 * 
 * @param {string} extractedText - Teks mentah hasil OCR dari lab report
 * @returns {Promise<string|undefined>} - Penjelasan ramah lansia atau undefined jika terjadi error
 */
export const analyzeLabData = async (extractedText) => {
  const requestBody = {
    "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "messages": [
      {
        "role": "system",
        "content": "Anda adalah asisten kesehatan dari HealthLens AI. Bantu lansia memahami hasil lab berikut dengan bahasa Indonesia yang sangat sederhana dan empatik. Temukan istilah medis penting, jelaskan dengan lembut, berikan saran gaya hidup yang ringan, dan sertakan disclaimer bahwa ini bukan diagnosa dokter."
      },
      {
        "role": "user",
        "content": `Berikut adalah data hasil lab: ${extractedText}`
      }
    ]
  };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://zurisky.my.id"
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    if (result && result.choices && result.choices[0] && result.choices[0].message) {
      return result.choices[0].message.content;
    }
    throw new Error("Invalid response structure from OpenRouter");
  } catch (error) {
    console.error("Gagal memanggil OpenRouter:", error);
  }
};

/**
 * Menganalisis chat tentang hasil lab menggunakan model OpenRouter.
 * 
 * @param {Array} history - Riwayat chat [{role: 'bot'|'user', text: '...'}]
 * @param {object} labData - Data lab user
 * @returns {Promise<string>} - Jawaban asisten AI
 */
export const chatWithLabAssistant = async (history, labData) => {
  const systemPrompt = `Kamu adalah LabView AI Assistant. Konteks data lab user:
Hemoglobin: ${labData?.hemoglobin || 'Tidak ada data'} g/dL,
Glucose: ${labData?.glucose || 'Tidak ada data'} mg/dL,
Cholesterol: ${labData?.cholesterol || 'Tidak ada data'} mg/dL,
Uric Acid: ${labData?.uricAcid || labData?.uric_acid || 'Tidak ada data'} mg/dL.

Tugas Anda adalah membantu user memahami hasil lab mereka. Jawab pertanyaan user dengan singkat, padat, ramah, dan empatik dalam Bahasa Indonesia. Gunakan penjelasan istilah medis yang disederhanakan agar mudah dipahami. Ingatkan selalu dengan lembut untuk berkonsultasi ke dokter untuk diagnosa medis resmi.`;

  // Map history to OpenRouter messages
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.text
    }))
  ];

  const requestBody = {
    "model": "google/gemini-2.5-flash:free",
    "messages": formattedMessages
  };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://zurisky.my.id"
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    if (result && result.choices && result.choices[0] && result.choices[0].message) {
      return result.choices[0].message.content;
    }
    throw new Error("Failed response from Gemini Free");
  } catch (error) {
    console.warn("Gagal memanggil Gemini Free, mencoba fallback model...", error);
    try {
      requestBody.model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
      const fallbackResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://zurisky.my.id"
        },
        body: JSON.stringify(requestBody)
      });
      const fallbackResult = await fallbackResponse.json();
      if (fallbackResult && fallbackResult.choices && fallbackResult.choices[0] && fallbackResult.choices[0].message) {
        return fallbackResult.choices[0].message.content;
      }
    } catch (fallbackError) {
      console.error("Gagal memanggil fallback model OpenRouter:", fallbackError);
    }
    throw error;
  }
};

