import { NyanEngine } from "./js/engine.js";
import { NyanChat } from "./js/chat.js";
import { translations } from "./js/i18n.js";
import { NyanANS } from "./js/rans.js?v=1.8";

const MEOW_SOUNDS = [
    "./mp3/meow1.mp3",
    "./mp3/meow2.mp3",
    "./mp3/meow3.mp3",
    "./mp3/meow4.mp3",
    "./mp3/meow5.mp3",
];

let currentLang = 'en';
let ultraMode = false;

// グローバル要素
let apiKeyInput, aiReviewSection, reviewText, ultraExplain;
let voiceButtons = [];

const voiceState = {
    speaking: false,
    textareaId: null,
    button: null,
    utterance: null,
    meowTimer: null,
    activeClips: new Set(),
};

function setVoiceButtonLabels(isSpeaking) {
    const label = isSpeaking ? translations[currentLang].stopVoiceBtn : translations[currentLang].voiceBtn;
    voiceButtons.forEach((button) => {
        if (button) button.textContent = label;
    });
}

function clearVoicePlayback(cancelSpeech = false) {
    if (voiceState.meowTimer) {
        clearInterval(voiceState.meowTimer);
        voiceState.meowTimer = null;
    }

    for (const clip of voiceState.activeClips) {
        try {
            clip.pause();
            clip.currentTime = 0;
        } catch (_) {
            // Ignore cleanup failures for short-lived audio elements.
        }
    }
    voiceState.activeClips.clear();

    if (cancelSpeech && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    voiceState.speaking = false;
    voiceState.textareaId = null;
    voiceState.button = null;
    voiceState.utterance = null;
    setVoiceButtonLabels(false);
}

function playRandomMeow() {
    const src = MEOW_SOUNDS[Math.floor(Math.random() * MEOW_SOUNDS.length)];
    const audio = new Audio(src);
    audio.volume = 0.85;
    voiceState.activeClips.add(audio);
    audio.addEventListener('ended', () => voiceState.activeClips.delete(audio), { once: true });
    audio.addEventListener('error', () => voiceState.activeClips.delete(audio), { once: true });
    audio.play().catch(() => {
        voiceState.activeClips.delete(audio);
    });
}

function toSpeechText(rawText) {
    return rawText
        .replace(/^---.*$/gm, ' ')
        .replace(/NyanZip v1\.1/g, ' ')
        .replace(/NYAN ULTRA rANS v1\.2/g, ' ')
        .replace(/--- End of Nyan ---/g, ' ')
        .replace(/--- End of Ultra ---/g, ' ')
        .replace(/[🐈🐾👑✨😻😾😿🙀🫖]/g, ' ')
        .replace(/nyaa~/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function speakNyan(textareaId, button) {
    const target = document.getElementById(textareaId);
    if (!target) return;

    const rawText = target.value.trim();
    if (!rawText) return alert(translations[currentLang].inputAlert);

    if (!('speechSynthesis' in window)) {
        alert(translations[currentLang].voiceUnavailable);
        playRandomMeow();
        return;
    }

    if (voiceState.speaking) {
        const sameTarget = voiceState.textareaId === textareaId;
        clearVoicePlayback(true);
        if (sameTarget) {
            return;
        }
    }

    const speechText = toSpeechText(rawText);
    if (!speechText) return alert(translations[currentLang].inputAlert);

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
    utterance.rate = ultraMode ? 0.9 : 1;
    utterance.pitch = ultraMode ? 1.9 : 1.6;
    utterance.volume = 1;
    utterance.onstart = () => {
        if (voiceState.utterance !== utterance) return;
        voiceState.speaking = true;
        voiceState.textareaId = textareaId;
        voiceState.button = button || null;
        setVoiceButtonLabels(true);
        playRandomMeow();
        voiceState.meowTimer = setInterval(playRandomMeow, ultraMode ? 900 : 1200);
    };
    utterance.onend = () => {
        if (voiceState.utterance !== utterance) return;
        clearVoicePlayback(false);
    };
    utterance.onerror = () => {
        if (voiceState.utterance !== utterance) return;
        clearVoicePlayback(false);
    };

    voiceState.utterance = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

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
    const cSpeakBtn = document.getElementById('btn-speak-compress');

    const dInput = document.getElementById('d-input');
    const dOutput = document.getElementById('d-output');
    const dBtn = document.getElementById('btn-decompress');
    const dStats = document.getElementById('d-stats');
    const dRatio = document.getElementById('d-ratio');
    const dSpeakBtn = document.getElementById('btn-speak-decompress');

    voiceButtons = [cSpeakBtn, dSpeakBtn].filter(Boolean);

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
    if (cSpeakBtn) cSpeakBtn.addEventListener('click', () => speakNyan('c-output', cSpeakBtn));
    if (dSpeakBtn) dSpeakBtn.addEventListener('click', () => speakNyan('d-output', dSpeakBtn));

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
    setVoiceButtonLabels(voiceState.speaking);
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
