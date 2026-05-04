import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { getLocalizedProfileText } from '../utils/profileText';

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeProfileLang(value) {
  const base = safeStr(value).toLowerCase().split(/[-_]/)[0] || '';
  if (base === 'tr' || base === 'id') return base;
  return '';
}

const TURKISH_CHAR_RE = /[çğıöşüÇĞİÖŞÜ]/;
const TURKISH_WORD_RE = /\b(ve|ile|icin|için|ama|fakat|olarak|evlilik|hayat|namaz|dürüst|guvenilir|güvenilir|ariyorum|arıyorum|istiyorum|kendimi)\b/gi;
const INDONESIAN_WORD_RE = /\b(yang|dan|dengan|untuk|tidak|ingin|mencari|seorang|saya|kami|sholat|salat|jujur|menikah|kehidupan|wanita|keluarga|suami|bertanggung|jawab|pekerja|rumah|sendiri|luar|negeri|negri)\b/gi;

function countRegexMatches(text, regex) {
  const source = safeStr(text);
  if (!source) return 0;
  const re = new RegExp(regex.source, regex.flags);
  let count = 0;
  while (re.exec(source)) count += 1;
  return count;
}

function inferProfileTextLang({ sourceLang, original, trValue, idValue } = {}) {
  const direct = normalizeProfileLang(sourceLang);
  const text = safeStr(original);
  const tr = safeStr(trValue);
  const id = safeStr(idValue);

  if (!text) return direct || '';
  if (tr && text === tr && text !== id) return 'tr';
  if (id && text === id && text !== tr) return 'id';
  if (tr && !id && text === tr) return 'tr';
  if (id && !tr && text === id) return 'id';

  const turkishScore = (TURKISH_CHAR_RE.test(text) ? 3 : 0) + countRegexMatches(text, TURKISH_WORD_RE);
  const indonesianScore = countRegexMatches(text, INDONESIAN_WORD_RE);
  const strongDetected =
    turkishScore <= 0 && indonesianScore <= 0
      ? ''
      : Math.abs(turkishScore - indonesianScore) < 2
        ? ''
        : turkishScore > indonesianScore
          ? 'tr'
          : 'id';

  if (strongDetected && strongDetected !== direct) return strongDetected;
  return direct || strongDetected || '';
}

function getNestedValue(obj, key) {
  if (!obj || typeof obj !== 'object' || !key) return '';
  return (
    safeStr(obj?.[key]) ||
    safeStr(obj?.details?.[key]) ||
    safeStr(obj?.publicProfile?.[key]) ||
    safeStr(obj?.application?.[key])
  );
}

function getTargetVariant(obj, field, targetLang) {
  if (!obj || typeof obj !== 'object' || !targetLang) return '';
  const suffix = targetLang === 'tr' ? 'Tr' : 'Id';
  return getNestedValue(obj, `${field}${suffix}`);
}

function getSourceText(obj, field) {
  const source = obj && typeof obj === 'object' ? obj : {};
  const direct = getNestedValue(source, field);
  if (direct) return direct;

  if (field === 'about') {
    return safeStr(source?.bio) || safeStr(source?.details?.about) || safeStr(source?.details?.bio);
  }
  if (field === 'expectations') {
    return safeStr(source?.details?.expectations);
  }

  return '';
}

const translationCache = new Map();
const inflightCache = new Map();

export function useAutoLocalizedProfileText(obj, field, uiLang) {
  const targetLang = normalizeProfileLang(uiLang);
  const storedLocalized = useMemo(() => getLocalizedProfileText(obj, field, uiLang), [field, obj, uiLang]);
  const targetVariant = useMemo(() => getTargetVariant(obj, field, targetLang), [field, obj, targetLang]);
  const sourceText = useMemo(() => getSourceText(obj, field), [field, obj]);
  const sourceLang = useMemo(
    () =>
      getNestedValue(obj, 'profileTextLang') ||
      getNestedValue(obj, 'sourceLang') ||
      getNestedValue(obj, 'language'),
    [obj]
  );
  const trValue = useMemo(() => getNestedValue(obj, `${field}Tr`), [field, obj]);
  const idValue = useMemo(() => getNestedValue(obj, `${field}Id`), [field, obj]);
  const effectiveSourceLang = useMemo(
    () => inferProfileTextLang({ sourceLang, original: sourceText, trValue, idValue }),
    [idValue, sourceLang, sourceText, trValue]
  );

  const stableStoredLocalized = useMemo(() => {
    if (!storedLocalized) return '';
    if (storedLocalized === sourceText && !targetVariant) return '';
    return storedLocalized;
  }, [sourceText, storedLocalized, targetVariant]);

  const initialValue = targetVariant || stableStoredLocalized || sourceText;
  const [value, setValue] = useState(initialValue);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    setValue(targetVariant || stableStoredLocalized || sourceText);
  }, [sourceText, stableStoredLocalized, targetVariant]);

  useEffect(() => {
    setRetryNonce(0);
  }, [field, sourceText, targetLang, trValue, idValue]);

  const cacheKey = useMemo(() => {
    if (!targetLang || targetVariant || !sourceText) return '';
    if (effectiveSourceLang === targetLang) return '';
    return JSON.stringify([field, targetLang, sourceText, effectiveSourceLang, trValue, idValue]);
  }, [effectiveSourceLang, field, idValue, sourceText, targetLang, targetVariant, trValue]);

  useEffect(() => {
    if (!cacheKey) return;

    if (translationCache.has(cacheKey)) {
      setValue(translationCache.get(cacheKey) || sourceText);
      return;
    }

    let cancelled = false;

    const pending = inflightCache.get(cacheKey)
      || (async () => {
        try {
          const payload = await authFetch(`/api/matchmaking-profile-text-translate?ts=${Date.now()}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              field,
              text: sourceText,
              sourceLang: effectiveSourceLang,
              targetLang,
              trValue,
              idValue,
              key: `${field}:${targetLang}`,
            }),
          });
          return safeStr(payload?.text);
        } catch {
          return '';
        } finally {
          inflightCache.delete(cacheKey);
        }
      })();

    inflightCache.set(cacheKey, pending);

    pending.then((translated) => {
      const resolved = translated || sourceText;
      if (translated) {
        translationCache.set(cacheKey, translated);
      } else if (!cancelled && retryNonce < 1) {
        window.setTimeout(() => {
          if (!cancelled) setRetryNonce((current) => current + 1);
        }, 1500);
      }
      if (!cancelled) setValue(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, effectiveSourceLang, field, idValue, retryNonce, sourceText, targetLang, trValue]);

  return value;
}