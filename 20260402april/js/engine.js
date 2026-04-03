// 猫語のエンコード・デコードコア
export const NyanEngine = {
    HEADER: "--- 🐈 NyanZip v1.1 🐾 ---",
    FOOTER: "--- End of Nyan ---",

    // テキスト -> 猫語 (巨大化)
    encode(text) {
        if (!text) return "";
        let result = this.HEADER + "\n";
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        data.forEach((byte, index) => {
            const binary = byte.toString(2).padStart(8, '0');
            for (let bit of binary) {
                result += (bit === '0') ? "meow " : "MEOW!! ";
            }
            
            // 装飾的な区切り
            if (index % 5 === 0) result += "nyaa~ ";
            if (index % 10 === 0) result += "🐈🐾 ";
            if (index % 3 === 0) result += "\n";
        });
        
        result += "\n" + this.FOOTER;
        return result;
    },

    // 猫語 -> テキスト (復元)
    decode(catText) {
        try {
            // ヘッダーとフッターを無視して中身だけ取り出す
            const startIdx = catText.indexOf(this.HEADER);
            const endIdx = catText.indexOf(this.FOOTER);
            
            let content = catText;
            if (startIdx !== -1 && endIdx !== -1) {
                content = catText.substring(startIdx + this.HEADER.length, endIdx);
            }

            // 余計な絵文字や改行をスペースに置換して単語に分解
            const cleaned = content
                .replace(/nyaa~/g, ' ')
                .replace(/🐈🐾/g, ' ')
                .replace(/[\r\n]/g, ' ')
                .trim();
                
            const words = cleaned.split(/\s+/);
            
            let binaryString = "";
            for (let word of words) {
                if (word === "meow") binaryString += "0";
                else if (word === "MEOW!!") binaryString += "1";
            }
            
            // 8ビットごとにバイトに戻す
            const bytes = [];
            for (let i = 0; i < binaryString.length; i += 8) {
                const byte = binaryString.slice(i, i + 8);
                if (byte.length === 8) {
                    bytes.push(parseInt(byte, 2));
                }
            }
            
            if (bytes.length === 0) return "猫語が見つからないにゃ！ meow か MEOW!! を入れてにゃ。";
            
            const decoder = new TextDecoder();
            return decoder.decode(new Uint8Array(bytes));
        } catch (e) {
            console.error(e);
            return "復元失敗だにゃ... データの毛並みが乱れてるにゃ！😾";
        }
    }
};
