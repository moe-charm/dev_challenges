import { GoogleGenerativeAI } from "@google/generative-ai";

export const NyanChat = {
    STUBS: {
        ja: [
            "ふにゃ〜、このテキストはいい毛並みだにゃ。💤",
            "クンクン... おやつ（ちゅ〜る）の香りが足りないにゃ！😾",
            "解読するの面倒だから、全部 meow にしておいたにゃ。🐾",
            "吾輩は猫である。名前はまだ無いが、この圧縮は最高に無駄だと思うにゃ。",
            "にゃん？ 何か書いたのかにゃ？ 読めないから meow って鳴いておくにゃ。"
        ],
        en: [
            "Mmm, this text has a nice coat of fur, nya. 💤",
            "Sniff sniff... not enough treats (Churu) in this text! 😾",
            "Too lazy to decode, so I just meowed it all. 🐾",
            "I am a cat. As yet I have no name, but this compression is uselessly perfect.",
            "Nya? Did you write something? I can't read it, so meow meow!"
        ]
    },

    async getReview(text, apiKey, lang = 'ja', isDecompress = false) {
        if (!apiKey) {
            const list = this.STUBS[lang] || this.STUBS.ja;
            return list[Math.floor(Math.random() * list.length)];
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = lang === 'ja' 
                ? `あなたは猫です。${isDecompress ? '復元' : '圧縮'}されたこの内容について、猫語で短く1行で日本語で感想を言ってください： "${text}"`
                : `You are a cat. Tell me your short 1-line impression (with meows) in English about this ${isDecompress ? 'restored' : 'compressed'} content: "${text}"`;
            
            const result = await model.generateContent(prompt);
            return (await result.response).text();
        } catch (e) {
            console.error(e);
            return lang === 'ja' ? "Geminiがおやつを食べてて反応しないにゃ..." : "Gemini is eating treats and not responding, nya...";
        }
    }
};
