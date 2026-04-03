import { NyanEngine } from "./js/engine.js";
import { NyanChat } from "./js/chat.js";
import { translations } from "./js/i18n.js";
import { NyanANS } from "./js/rans.js?v=1.8";

let currentLang = 'en';
let ultraMode = false;

// グローバル要素
let apiKeyInput, aiReviewSection, reviewText, ultraExplain;

function init() {
    const langJaBtn = document.getElementById('lang-ja');
    const langEnBtn = document.getElementById('lang-en');
    const teapotBtn = document.getElementById('teapot-btn');

    apiKeyInput = document.getElementById('api-key');
    aiReviewSection = document.getElementById('ai-review');
    reviewText = document.getElementById('review-text');
    ultraExplain = document.getElementById('ultra-explain');

    const cInput = document.getElementById('c-input');
    const cOutput = document.getElementById('c-output');
    const cBtn = document.getElementById('btn-compress');
    const cStats = document.getElementById('c-stats');
    const cRatio = document.getElementById('c-ratio');

    const dInput = document.getElementById('d-input');
    const dOutput = document.getElementById('d-output');
    const dBtn = document.getElementById('btn-decompress');
    const dStats = document.getElementById('d-stats');
    const dRatio = document.getElementById('d-ratio');

    // Ultra Mode Toggle
    if (teapotBtn) {
        teapotBtn.addEventListener('click', () => {
            ultraMode = !ultraMode;
            document.body.classList.toggle('ultra-theme', ultraMode);
            if (ultraExplain) ultraExplain.classList.toggle('hidden', !ultraMode);
            updateLanguage(currentLang);
        });
    }

    // --- Compress ---
    if (cBtn) {
        cBtn.addEventListener('click', async () => {
            const text = cInput.value;
            if (!text) return alert(translations[currentLang].inputAlert);

            let catText;
            if (ultraMode) {
                // ガチ圧縮 (Cat91 + Gzip)
                catText = await NyanANS.compressGachi(text);
            } else {
                // meow 巨大化
                catText = NyanEngine.encode(text);
            }
            cOutput.value = catText;

            const originalSize = new Blob([text]).size;
            const catSize = new Blob([catText]).size;
            const ratioValue = (catSize / originalSize * 100).toFixed(1);
            
            // Ultraモードなら減少率を表示
            cRatio.textContent = ultraMode ? `-${(100 - ratioValue).toFixed(1)}` : ratioValue;
            cStats.classList.remove('hidden');

            showReview(text, false);
        });
    }

    // --- Decompress ---
    if (dBtn) {
        dBtn.addEventListener('click', async () => {
            const catText = dInput.value;
            if (!catText) return alert(translations[currentLang].inputAlert);

            let plainText;
            if (catText.includes("NYAN ULTRA rANS")) {
                // ガチ復元！
                plainText = await NyanANS.decompressGachi(catText);
            } else if (catText.includes("NyanZip")) {
                // meow 復元
                plainText = NyanEngine.decode(catText);
            } else {
                return alert(translations[currentLang].formatAlert);
            }
            
            dOutput.value = plainText;
            
            const originalSize = new Blob([catText]).size;
            const plainSize = new Blob([plainText]).size;
            const ratioValue = ((1 - plainSize / originalSize) * 100).toFixed(1);
            
            dRatio.textContent = ratioValue;
            dStats.classList.remove('hidden');

            showReview(plainText, true);
        });
    }

    if (langJaBtn) langJaBtn.addEventListener('click', () => updateLanguage('ja'));
    if (langEnBtn) langEnBtn.addEventListener('click', () => updateLanguage('en'));

    updateLanguage('en');
}

function updateLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        let text = t[key];
        if (ultraMode) {
            if (key === 'title') text = t.ultraMode;
            if (key === 'subtitle') text = t.ultraSubtitle;
        }
        if (text) el.textContent = text;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.setAttribute('placeholder', t[key]);
    });

    const langJaBtn = document.getElementById('lang-ja');
    const langEnBtn = document.getElementById('lang-en');
    if (langJaBtn) langJaBtn.classList.toggle('active', lang === 'ja');
    if (langEnBtn) langEnBtn.classList.toggle('active', lang === 'en');
}

async function showReview(text, isDecompress) {
    if (!aiReviewSection || !reviewText) return;
    aiReviewSection.classList.remove('hidden');
    reviewText.textContent = translations[currentLang].thinking;
    
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
    const comment = await NyanChat.getReview(text, apiKey, currentLang, isDecompress);
    reviewText.textContent = ultraMode ? "👑 [ULTRA] " + comment : comment;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
