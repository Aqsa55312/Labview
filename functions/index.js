const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ambil dari config (AMAN)
const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

exports.analyzeLab = functions.https.onRequest(async (req, res) => {
    try {
        // 🔒 CORS basic
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST");

        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        // 🔥 PROMPT YANG SUDAH DIPERBAIKI (LEBIH STRICT)
        const prompt = `
Anda adalah sistem ekstraksi data medis.

TUGAS:
- Ekstrak data dari teks OCR berikut:
"${text}"

ATURAN:
1. Ambil angka saja (gunakan titik sebagai desimal).
2. Jika tidak ditemukan → gunakan null (bukan 0).
3. Validasi:
   - glucose: 40–500
   - hemoglobin: 5–25
   - cholesterol: 100–400
   - uric_acid: 1–15
   Jika di luar range → null
4. Jangan mengarang data.
5. Format tanggal: YYYY-MM-DD (jika ada)

OUTPUT WAJIB JSON:
{
  "main_metrics": {
    "glucose": null,
    "hemoglobin": null,
    "cholesterol": null,
    "uric_acid": null
  },
  "all_data": {},
  "overall_status": "normal | warning | danger",
  "test_date": "",
  "explanation": "ringkas, maksimal 2 paragraf"
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        let parsed;
        try {
            parsed = JSON.parse(response.text());
        } catch (e) {
            return res.status(500).json({
                error: "Invalid JSON from AI",
                raw: response.text(),
            });
        }

        return res.json(parsed);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});