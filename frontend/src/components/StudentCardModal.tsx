import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Wifi,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Maximize2,
  Scan,
  Clock,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { UNIVERSITY_INFO } from '../services/mockData';
import { UniversityEmblem } from './UniversityEmblem';
import { tr, getStudyFormLabel, localizeText } from '../utils/i18n';

interface StudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, lang } = useAuth();
  const [isNfcTapping, setIsNfcTapping] = useState(false);
  const [turnstilePassed, setTurnstilePassed] = useState(false);

  // Big QR Code State
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [totpToken, setTotpToken] = useState<string>('');
  const [tokenSecondsLeft, setTokenSecondsLeft] = useState(30);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSimulated, setScanSimulated] = useState(false);

  // Generate real verifiable QR code data URL
  useEffect(() => {
    if (!profile && !user) return;
    const studentId = profile?.studentNumber || '2024-БИ-0412';
    const verifyPayload = JSON.stringify({
      uni: 'DemoTech University',
      type: 'CAMPUS_PASS_V2',
      id: studentId,
      name: user?.fullName || 'Студент',
      group: profile?.group || 'ДУ-101',
      validUntil: '2026-08-31',
      token: `SKUD-${studentId.replace(/[^0-9]/g, '') || '84920'}`,
    });

    QRCode.toDataURL(
      verifyPayload,
      {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#0E1F36',
          light: '#FFFFFF',
        },
        width: 320,
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [user, profile]);

  // Live anti-tamper clock and rotating TOTP code for scanner view
  useEffect(() => {
    if (!isQrExpanded) return;
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      // 30-second rotating security window
      const windowIdx = Math.floor(now.getTime() / 30000);
      const seed = Math.abs(
        (windowIdx * 9301 + 49297) ^ (profile?.studentNumber?.charCodeAt(0) || 42)
      );
      const code = String(100000 + (seed % 900000));
      setTotpToken(`${code.slice(0, 3)}-${code.slice(3)}`);
      setTokenSecondsLeft(30 - (Math.floor(now.getTime() / 1000) % 30));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isQrExpanded, profile?.studentNumber, lang]);

  // Turnstile scanner audio chime simulation
  const playTurnstileBeep = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } catch {
      // Audio context silenced or not allowed by browser autoplay
    }
  };

  const handleNfcSimulate = () => {
    setIsNfcTapping(true);
    setTimeout(() => {
      setIsNfcTapping(false);
      setTurnstilePassed(true);
      playTurnstileBeep();
      setTimeout(() => setTurnstilePassed(false), 3000);
    }, 1200);
  };

  const handleQrScanSimulate = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanSimulated(true);
      playTurnstileBeep();
      setTimeout(() => setScanSimulated(false), 3500);
    }, 900);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      {/* ─────────────────────────────────────────────────────────────
          BIG QR CODE SCANNER VIEW (TRIGGERED ON QR CLICK)
          ───────────────────────────────────────────────────────────── */}
      {isQrExpanded ? (
        <div className="relative w-full max-w-sm bg-[#F8FAFC] dark:bg-[#0E1F36] rounded-3xl shadow-2xl overflow-hidden border-2 border-[#245A91] flex flex-col items-center p-5 sm:p-6 text-center animate-scale-in select-none">
          {/* Top header navigation */}
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-[#245A91]/30">
            <button
              onClick={() => setIsQrExpanded(false)}
              className="flex items-center space-x-1.5 text-xs font-sans font-medium text-[#142D4E] dark:text-[#93C5FD] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'ru' ? 'Назад' : 'Back'}</span>
            </button>

            <div className="flex items-center space-x-1.5">
              <UniversityEmblem size={20} />
              <span className="font-bold text-xs uppercase tracking-tight text-[#142D4E] dark:text-[#FFFFFF]">
                {tr(lang, 'DemoTech СКУД', 'DemoTech Access')}
              </span>
            </div>

            <button
              onClick={() => setIsQrExpanded(false)}
              className="p-1 rounded-full bg-[#142D4E]/10 hover:bg-[#142D4E]/20 text-[#142D4E] dark:text-[#FFFFFF] transition-colors cursor-pointer"
              aria-label={tr(lang, 'Закрыть сканер', 'Close scanner view')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Student Dossier Quick Strip */}
          <div className="flex items-center space-x-3 w-full bg-white dark:bg-[#112238] p-2.5 rounded-xl border border-[#245A91]/30 mb-3 shadow-xs">
            <img
              src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={user.fullName}
              className="w-10 h-10 rounded-lg object-cover border border-[#245A91]"
            />
            <div className="text-left flex-1 min-w-0">
              <h4 className="font-semibold text-xs text-[#142D4E] dark:text-[#FFFFFF] truncate">
                {user.fullName}
              </h4>
              <p className="text-[10px] text-[#667085] dark:text-[#94A3B8] truncate">
                {tr(lang, 'Гр.', 'Group')} {profile?.group || 'ДУ-101'} • № {profile?.studentNumber}
              </p>
            </div>
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PASS</span>
            </div>
          </div>

          {/* Big QR Code Scanner Target Box */}
          <div className="relative w-64 h-64 bg-white p-3 rounded-2xl shadow-lg border-2 border-[#142D4E]/20 dark:border-[#245A91]/40 flex items-center justify-center overflow-hidden">
            {/* Viewfinder Corner Brackets */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-3 border-l-3 border-[#245A91] rounded-tl-md pointer-events-none" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-3 border-r-3 border-[#245A91] rounded-tr-md pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-3 border-l-3 border-[#245A91] rounded-bl-md pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-3 border-r-3 border-[#245A91] rounded-br-md pointer-events-none" />

            {/* Simulated Animated Optical Laser Scan Beam */}
            {isScanning && (
              <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-bounce z-20" />
            )}

            {/* Actual High-Res Scannable QR Code Image */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Verifiable Campus QR Code"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <QrCode className="w-48 h-48 text-[#142D4E]" />
            )}

            {/* University Central Emblem Watermark in QR Code */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-[#0E1F36] border border-[#245A91] p-1 shadow-md flex items-center justify-center">
                <UniversityEmblem size={24} />
              </div>
            </div>
          </div>

          {/* Live Anti-Tamper Security Telemetry */}
          <div className="w-full mt-3 p-2.5 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-[#142D4E] dark:text-[#93C5FD]">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold">{currentTime || '12:00:00'}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[#667085] dark:text-[#94A3B8]">
              <RefreshCw className="w-3 h-3 text-[#245A91] dark:text-[#93C5FD] animate-spin" />
              <span>
                OTP: <strong className="text-[#142D4E] dark:text-[#FFFFFF]">{totpToken || '849-210'}</strong>
              </span>
              <span className="text-[10px] text-[#245A91] dark:text-[#93C5FD]">({tokenSecondsLeft}s)</span>
            </div>
          </div>

          {/* Turnstile Scanner Simulation Feedback */}
          <div className="w-full mt-3 space-y-2">
            {scanSimulated ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-sans font-semibold flex items-center justify-center space-x-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {tr(lang, 'Турникет № 1 разблокирован! Проход разрешен.', 'Turnstile #1 unlocked! Access granted.')}
                </span>
              </div>
            ) : (
              <button
                onClick={handleQrScanSimulate}
                disabled={isScanning}
                className="w-full py-2.5 px-4 rounded-xl bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/50 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-98 disabled:opacity-50"
              >
                <Scan className="w-4 h-4 text-[#93C5FD]" />
                <span>
                  {isScanning
                    ? tr(lang, 'Лазерное сканирование...', 'Scanning optical QR...')
                    : tr(lang, 'Проверить считывание сканером', 'Test Optical Scanner Read')}
                </span>
              </button>
            )}

            <p className="text-[10px] text-[#667085] font-sans">
              {tr(
                lang,
                'Поднесите экран к оптическому считывателю турникета на дистанцию 10-15 см.',
                'Hold your screen 10–15 cm in front of the turnstile optical reader.',
              )}
            </p>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            NORMAL STUDENT ID CARD VIEW
            ───────────────────────────────────────────────────────────── */
        <div className="relative w-full max-w-sm bg-white dark:bg-[#112238] rounded-2xl shadow-2xl overflow-hidden border border-[#245A91]/40">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-30 p-1.5 rounded-full bg-[#0E1F36]/80 hover:bg-[#0E1F36] text-[#FFFFFF] border border-[#245A91]/40 hover:border-[#245A91] transition-colors shadow-sm cursor-pointer"
            aria-label={tr(lang, 'Закрыть', 'Close')}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Prestigious University Pass Surface */}
          <div className="relative p-6 bg-[#142D4E] text-[#FFFFFF] overflow-hidden select-none">
            {/* Subtle Guilloche / Architectural Seal Background */}
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
              <UniversityEmblem size={240} variant="gold" />
            </div>

            {/* Top Gold Bar with generous right padding to avoid close button overlap */}
            <div className="flex items-center justify-between mb-5 relative z-10 border-b border-[#245A91]/30 pb-3 pr-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#0E1F36] border border-[#245A91]/60 flex items-center justify-center p-1 shadow-inner">
                  <UniversityEmblem size={26} />
                </div>
                <div>
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-[#FFFFFF]">
                    {UNIVERSITY_INFO.name}
                  </h3>
                  <p className="text-[10px] text-[#93C5FD] font-mono tracking-wide">
                    {lang === 'ru' ? 'Студенческий билет' : 'Digital Student ID'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0E1F36] border border-[#245A91]/30 text-[#93C5FD] text-[10px] font-mono">
                <Wifi className="w-3.5 h-3.5 rotate-90 text-[#93C5FD]" />
                <span>NFC</span>
              </div>
            </div>

            {/* Student Photo & Dossier */}
            <div className="flex space-x-4 items-center mb-5 relative z-10">
              <div className="relative flex-shrink-0">
                <img
                  src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={user.fullName}
                  className="w-20 h-24 rounded-lg object-cover border-2 border-[#245A91]/80 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#142D4E] border border-[#245A91] flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#93C5FD]" />
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <h2 className="font-bold text-base text-[#FFFFFF] leading-snug">
                  {user.fullName}
                </h2>
                <p className="text-[11px] font-sans text-[#93C5FD] font-medium">
                  {profile?.group} • {tr(lang, `${profile?.year} курс`, `Year ${profile?.year}`)}
                </p>
                <p className="text-[10px] text-[#FFFFFF]/80 line-clamp-1 font-sans">
                  {localizeText(profile?.program, lang)}
                </p>
                <div className="pt-1 flex items-center space-x-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-[#0E1F36] border border-[#245A91]/40 text-[#93C5FD]">
                    № {profile?.studentNumber}
                  </span>
                  <span className="text-[#FFFFFF]/75 font-sans">
                    {getStudyFormLabel(profile?.studyForm || 'Бюджет', lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Dynamic QR Verification Code (Click to Enlarge) */}
            <div
              onClick={() => setIsQrExpanded(true)}
              className="bg-[#0E1F36] hover:bg-[#1C3B65] rounded-xl p-3 flex items-center justify-between border border-[#60A5FA]/40 hover:border-[#93C5FD] transition-all cursor-pointer group shadow-sm relative z-10"
              title={lang === 'ru' ? 'Нажмите, чтобы открыть QR-код на весь экран для турникета' : 'Click to enlarge QR for scanner'}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-sans text-[#CBD5E1] uppercase tracking-wider">
                    {tr(lang, 'Турникет кампуса', 'Campus Turnstile')}
                  </span>
                  <span className="text-[9px] font-sans text-[#93C5FD] bg-[#245A91]/30 px-1.5 py-0.5 rounded border border-[#60A5FA]/40 flex items-center space-x-1 group-hover:bg-[#245A91]/50 transition-colors">
                    <Maximize2 className="w-2.5 h-2.5 text-[#93C5FD]" />
                    <span>{lang === 'ru' ? 'Увеличить' : 'Enlarge'}</span>
                  </span>
                </div>
                <p className="font-mono text-xs text-[#93C5FD] font-bold">
                  VALID • {currentTime ? 'ACTIVE' : 'ONLINE'}
                </p>
                <p className="text-[9px] text-[#FFFFFF]/60 font-mono">
                  CRC32: {profile?.studentNumber?.replace(/[^0-9]/g, '') || '84920'} • {lang === 'ru' ? 'Нажмите для считывания' : 'Tap to scan'}
                </p>
              </div>

              {/* QR Code Box with Hover Indicator */}
              <div className="relative">
                <div className="w-14 h-14 bg-white p-1 rounded-md flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-transform border border-[#245A91]/50">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-12 h-12 object-contain" />
                  ) : (
                    <QrCode className="w-12 h-12 text-[#142D4E]" />
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#142D4E] border border-[#60A5FA] flex items-center justify-center text-[#93C5FD] shadow-xs group-hover:scale-110 transition-transform">
                  <Maximize2 className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Security Chip Notice */}
            <div className="mt-3 text-center text-[10px] font-mono text-[#93C5FD] flex items-center justify-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#93C5FD]" />
              <span>NFC MIFARE DESFire EV3 • Secure Campus Pass</span>
            </div>
          </div>

          {/* Turnstile Access Simulation Bar */}
          <div className="p-4 bg-white dark:bg-[#112238] border-t border-[#DCE2EA] dark:border-[#1E395B] text-center space-y-2">
            {turnstilePassed ? (
              <div className="p-2.5 rounded-lg bg-[#142D4E]/10 border border-[#142D4E]/30 text-[#142D4E] dark:text-[#60A5FA] text-xs font-sans font-semibold flex items-center justify-center space-x-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-[#142D4E] dark:text-[#60A5FA]" />
                <span>
                  {tr(lang, 'Проход через турникет разрешен! Приятного дня.', 'Turnstile access granted! Have a great day.')}
                </span>
              </div>
            ) : (
              <button
                onClick={handleNfcSimulate}
                disabled={isNfcTapping}
                className="w-full py-2.5 px-4 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#60A5FA]/40 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Wifi className={`w-4 h-4 text-[#93C5FD] ${isNfcTapping ? 'animate-ping' : ''}`} />
                <span>
                  {isNfcTapping
                    ? tr(lang, 'Считывание бесконтактного чипа...', 'Reading contactless NFC chip...')
                    : tr(lang, 'Приложить к турникету (NFC Test)', 'Tap at Turnstile (NFC Test)')}
                </span>
              </button>
            )}

            <p className="text-[10px] text-[#667085] font-sans">
              {localizeText(UNIVERSITY_INFO.faculty, lang)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
