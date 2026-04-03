// Nyan91: High-efficiency Cat-themed Base91 Encoding
// Based on the concept of separating binary compression from textual representation.

export const Nyan91 = {
    // 91種類の厳選された動物・自然の絵文字（重複なし・結合文字なし）
    alphabet: [
        "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🐱", 
        "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", 
        "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", 
        "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", 
        "🐜", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦀", 
        "🐡", "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🐅", "🐆", "🦓", 
        "🦍", "🐘", "🦏", "🐪", "🦒", "🐃", "🐂", "🐄", "🐎", "🐖", 
        "🐏", "🐑", "🐐", "🦌", "🐕", "🐩", "🐈", "🐓", "🦃", "🕊", 
        "🐇", "🐁", "🐀", "🐿", "🐾", "🐉", "🌵", "🌲", "🌳", "🌴", "🌱"
    ],

    encode(data) {
        let b = 0, n = 0, out = "";
        for (let i = 0; i < data.length; i++) {
            b |= data[i] << n;
            n += 8;
            if (n > 13) {
                let v = b & 8191;
                if (v > 88) {
                    b >>= 13;
                    n -= 13;
                } else {
                    v = b & 16383;
                    b >>= 14;
                    n -= 14;
                }
                out += this.alphabet[v % 91] + this.alphabet[Math.floor(v / 91)];
            }
        }
        if (n > 0) {
            out += this.alphabet[b % 91];
            if (n > 7 || b > 90) out += this.alphabet[Math.floor(b / 91)];
        }
        return out;
    },

    decode(text) {
        const symbols = Array.from(text);
        let v = -1, b = 0, n = 0, out = [];
        for (let i = 0; i < symbols.length; i++) {
            const c = this.alphabet.indexOf(symbols[i]);
            if (c === -1) continue;
            if (v === -1) {
                v = c;
            } else {
                v += c * 91;
                b |= v << n;
                n += (v & 8191) > 88 ? 13 : 14;
                while (n > 7) {
                    out.push(b & 255);
                    b >>= 8;
                    n -= 8;
                }
                v = -1;
            }
        }
        if (v !== -1) out.push((b | v << n) & 255);
        return new Uint8Array(out);
    }
};

export const NyanANS = {
    HEADER: "--- 👑 NYAN ULTRA rANS v1.2 👑 ---",

    // app.js から呼ばれるメソッド名に合わせたにゃ
    async compress(text) {
        return this.compressGachi(text);
    },

    async compressGachi(text) {
        const uint8 = new TextEncoder().encode(text);
        const stream = new Blob([uint8]).stream();
        const compressed = stream.pipeThrough(new CompressionStream('deflate'));
        const buffer = await new Response(compressed).arrayBuffer();
        const compressedBytes = new Uint8Array(buffer);
        
        const nyanText = Nyan91.encode(compressedBytes);
        return `${this.HEADER}\n${nyanText}\n--- End of Ultra ---`;
    },

    async decompress(ultraText) {
        return this.decompressGachi(ultraText);
    },

    async decompressGachi(ultraText) {
        try {
            const content = ultraText
                .replace(this.HEADER, '')
                .replace('--- End of Ultra ---', '')
                .trim();
            
            const compressedBytes = Nyan91.decode(content);
            const stream = new Blob([compressedBytes]).stream();
            const decompressed = stream.pipeThrough(new DecompressionStream('deflate'));
            const buffer = await new Response(decompressed).arrayBuffer();
            return new TextDecoder().decode(buffer);
        } catch (e) {
            console.error(e);
            return "Ultra Decompression failed! 😾";
        }
    }
};
