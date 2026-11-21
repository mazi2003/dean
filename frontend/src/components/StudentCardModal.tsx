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
import { UNIVERSITY_INFO } from '../constants/university';
import { UniversityEmblem } from './UniversityEmblem';
import { tr, getStudyFormLabel, localizeText } from '../utils/i18n';
import { resolveAvatarSrc } from '../utils/avatar';

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
          dark: '#161821',
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
      setTimeout(() => setTurnstilePassed(false), 4000);
    }, 700);
  };

  const handleQrScanSimulate = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanSimulated(true);
      playTurnstileBeep();
      setTimeout(() => setScanSimulated(false), 5000);
    }, 1100);
  };

  if (!isOpen || !user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr(lang, 'Электронный студенческий билет', 'Digital Student ID')}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
    >
      {/* ─────────────────────────────────────────────────────────────
          BIG QR CODE SCANNER VIEW (TRIGGERED ON QR CLICK)
          ───────────────────────────────────────────────────────────── */}
      {isQrExpanded ? (
        <div className="relative w-full max-w-sm bg-white dark:bg-[#171c26] rounded-3xl shadow-2xl overflow-hidden border border-[#33b712]/40 flex flex-col items-center p-6 text-center animate-scale-in select-none">
          {/* Top header navigation */}
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
            <button
              onClick={() => setIsQrExpanded(false)}
              className="flex items-center space-x-1.5 text-xs font-heading font-medium text-[#161821] dark:text-[#ffffff] hover:text-[#166534] dark:text-[#45d320] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'ru' ? 'Назад' : 'Back'}</span>
            </button>

            <div className="flex items-center space-x-1.5">
              <UniversityEmblem size={20} />
              <span className="font-heading font-bold text-xs uppercase tracking-tight text-[#161821] dark:text-[#ffffff]">
                {tr(lang, 'DemoTech СКУД', 'DemoTech Access')}
              </span>
            </div>

            <button
              onClick={() => setIsQrExpanded(false)}
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] text-[#161821] dark:text-[#ffffff] transition-colors cursor-pointer"
              aria-label={tr(lang, 'Закрыть сканер', 'Close scanner view')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Dossier Quick Strip */}
          <div className="flex items-center space-x-3 w-full bg-[#f6f6f9] dark:bg-[#121620] p-3 rounded-2xl border border-[#e2e4e8] dark:border-[#273142] mb-3 shadow-2xs">
            <img
              src={resolveAvatarSrc(profile?.avatarUrl, user.fullName)}
              alt={user.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#33b712]"
            />
            <div className="text-left flex-1 min-w-0">
              <h4 className="font-heading font-semibold text-xs text-[#161821] dark:text-[#ffffff] truncate">
                {user.fullName}
              </h4>
              <p className="text-[10px] text-[#475569] dark:text-[#94a3b8] truncate font-mono">
                {tr(lang, 'Гр.', 'Group')} {profile?.group || 'ДУ-101'} • № {profile?.studentNumber}
              </p>
            </div>
            <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#ebfbee] dark:bg-[#16351d] text-[#166534] dark:text-[#45d320] text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#33b712] animate-pulse" />
              <span>PASS</span>
            </div>
          </div>

          {/* Big QR Code Scanner Target Box */}
          <div className="relative w-64 h-64 bg-white p-3 rounded-3xl shadow-sm border border-[#e2e4e8] dark:border-[#273142] flex items-center justify-center overflow-hidden">
            {/* Viewfinder Corner Brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#33b712] rounded-tl-lg pointer-events-none" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#33b712] rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#33b712] rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#33b712] rounded-br-lg pointer-events-none" />

            {/* Simulated Animated Optical Laser Scan Beam */}
            {isScanning && (
              <div className="absolute inset-x-3 h-1 bg-gradient-to-r from-transparent via-[#33b712] to-transparent shadow-[0_0_12px_rgba(51,183,18,0.9)] animate-bounce z-20" />
            )}

            {/* Actual Scannable QR Code Image */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Verifiable Campus QR Code"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <QrCode className="w-48 h-48 text-[#161821]" />
            )}

            {/* University Central Emblem Watermark in QR Code */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-[#161821] border border-[#33b712] p-1 shadow-md flex items-center justify-center">
                <UniversityEmblem size={24} />
              </div>
            </div>
          </div>

          {/* Live Anti-Tamper Security Telemetry */}
          <div className="w-full mt-3 p-3 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-[#166534] dark:text-[#45d320]">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold">{currentTime || '12:00:00'}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[#475569] dark:text-[#94a3b8]">
              <RefreshCw className="w-3 h-3 text-[#166534] dark:text-[#45d320] animate-spin" />
              <span>
                OTP:{' '}
                <strong className="text-[#161821] dark:text-[#ffffff]">
                  {totpToken || '849-210'}
                </strong>
              </span>
              <span className="text-[10px] text-[#166534] dark:text-[#45d320]">({tokenSecondsLeft}s)</span>
            </div>
          </div>

          {/* Action Simulation Controls */}
          <div className="w-full mt-4 space-y-2">
            {scanSimulated ? (
              <div className="p-3 rounded-full bg-[#ebfbee] dark:bg-[#16351d] text-[#166534] dark:text-[#45d320] text-xs font-heading font-semibold flex items-center justify-center space-x-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>
                  {tr(
                    lang,
                    'Турникет открыт! Добро пожаловать в кампус.',
                    'Turnstile opened! Welcome to campus.'
                  )}
                </span>
              </div>
            ) : (
              <button
                onClick={handleQrScanSimulate}
                disabled={isScanning}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full btn-innopolis-primary text-xs font-heading font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Scan className="w-4 h-4 text-white" />
                <span>
                  {isScanning
                    ? tr(lang, 'Лазерное сканирование...', 'Scanning optical QR...')
                    : tr(lang, 'Проверить считывание сканером', 'Test Optical Scanner Read')}
                </span>
              </button>
            )}

            <p className="text-[10px] text-[#475569] dark:text-[#94a3b8] font-sans">
              {tr(
                lang,
                'Поднесите экран к оптическому считывателю турникета на дистанцию 10-15 см.',
                'Hold your screen 10–15 cm in front of the turnstile optical reader.'
              )}
            </p>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            NORMAL STUDENT ID CARD VIEW
            ───────────────────────────────────────────────────────────── */
        <div className="relative w-full max-w-sm bg-white dark:bg-[#171c26] rounded-3xl shadow-2xl overflow-hidden border border-[#33b712]/40">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-30 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
            aria-label={tr(lang, 'Закрыть', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Innopolis High-Tech Pass Surface */}
          <div className="relative p-6 bg-[#161821] text-white overflow-hidden select-none">
            {/* Dynamic decorative green gradient glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#33b712]/20 blur-2xl pointer-events-none" />
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-15 pointer-events-none">
              <UniversityEmblem size={240} variant="gold" />
            </div>

            {/* Top Bar with right padding */}
            <div className="flex items-center justify-between mb-4 relative z-10 border-b border-white/10 pb-3 pr-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#11141c] border border-[#33b712]/60 flex items-center justify-center p-1.5 shadow-inner flex-shrink-0">
                  <UniversityEmblem size={28} />
                </div>
                <div>
                  <div className="text-[9px] font-mono tracking-wider text-[#45d320] uppercase font-semibold">
                    {lang === 'ru'
                      ? 'МИНОБРНАУКИ РОССИИ • ГОСАККРЕДИТАЦИЯ'
                      : 'STATE ACCREDITED UNIVERSITY'}
                  </div>
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                    {UNIVERSITY_INFO.name}
                  </h3>
                  <p className="text-[10px] text-white/80 font-mono tracking-wide">
                    {lang === 'ru' ? 'Студенческий билет № ' : 'Student ID No. '}
                    <span className="font-bold text-[#45d320]">
                      {profile?.studentNumber || '2024-БИ-0412'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#11141c] border border-[#33b712]/40 text-[#45d320] text-[10px] font-mono flex-shrink-0">
                <Wifi className="w-3.5 h-3.5 rotate-90 text-[#45d320]" />
                <span>NFC</span>
              </div>
            </div>

            {/* Student Photo & Dossier */}
            <div className="flex space-x-4 items-center mb-4 relative z-10">
              <div className="relative flex-shrink-0">
                <img
                  src={resolveAvatarSrc(profile?.avatarUrl, user.fullName)}
                  alt={user.fullName}
                  className="w-20 h-24 rounded-2xl object-cover border-2 border-[#33b712] shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#161821] border border-[#33b712] flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#45d320]" />
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <h2 className="font-heading font-bold text-base text-white leading-snug">{user.fullName}</h2>
                <p className="text-[11px] font-sans text-[#45d320] font-semibold">
                  {profile?.group} • {tr(lang, `${profile?.year} курс`, `Year ${profile?.year}`)}
                </p>
                <p className="text-[10px] text-white/80 line-clamp-1 font-sans">
                  {localizeText(profile?.program, lang)}
                </p>
                <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                    {getStudyFormLabel(profile?.studyForm || 'Бюджет', lang)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#33b712]/20 border border-[#33b712]/40 text-[#45d320] font-semibold text-[9px]">
                    {lang === 'ru' ? 'АКТИВЕН ДО 31.08.2026' : 'VALID TO 31.08.2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Order Citation Strip */}
            <div className="mb-4 relative z-10 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 flex items-center justify-between text-[9px] font-mono text-white/80">
              <span className="text-[#45d320] font-medium">
                {lang === 'ru' ? 'Основание выдачи:' : 'Matriculation Order:'}
              </span>
              <span>
                {lang === 'ru'
                  ? 'Приказ № 841-СТ от 25.08.2024 г.'
                  : 'Decree No. 841-ST of 25.08.2024'}
              </span>
            </div>

            {/* Interactive Dynamic QR Verification Code */}
            <div
              onClick={() => setIsQrExpanded(true)}
              className="bg-white/10 hover:bg-white/15 rounded-2xl p-3 flex items-center justify-between border border-white/10 hover:border-[#33b712] transition-all cursor-pointer group shadow-sm relative z-10"
              title={
                lang === 'ru'
                  ? 'Нажмите, чтобы открыть QR-код на весь экран для турникета'
                  : 'Click to enlarge QR for scanner'
              }
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-heading text-white/80 uppercase tracking-wider">
                    {tr(lang, 'Турникет кампуса', 'Campus Turnstile')}
                  </span>
                  <span className="text-[9px] font-sans text-[#45d320] bg-[#33b712]/20 px-2 py-0.5 rounded-full border border-[#33b712]/30 flex items-center space-x-1 group-hover:bg-[#33b712]/30 transition-colors">
                    <Maximize2 className="w-2.5 h-2.5 text-[#45d320]" />
                    <span>{lang === 'ru' ? 'Увеличить' : 'Enlarge'}</span>
                  </span>
                </div>
                <p className="font-mono text-xs text-[#45d320] font-bold">
                  VALID • {currentTime ? 'ACTIVE' : 'ONLINE'}
                </p>
                <p className="text-[9px] text-white/60 font-mono">
                  CRC32: {profile?.studentNumber?.replace(/[^0-9]/g, '') || '84920'} •{' '}
                  {lang === 'ru' ? 'Нажмите для считывания' : 'Tap to scan'}
                </p>
              </div>

              {/* QR Code Box */}
              <div className="relative">
                <div className="w-14 h-14 bg-white p-1 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-transform border border-white/20">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-12 h-12 object-contain" />
                  ) : (
                    <QrCode className="w-12 h-12 text-[#161821]" />
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#161821] border border-[#33b712] flex items-center justify-center text-[#45d320] shadow-xs group-hover:scale-110 transition-transform">
                  <Maximize2 className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Security Chip Notice */}
            <div className="mt-3 text-center text-[10px] font-mono text-[#45d320] flex items-center justify-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#45d320]" />
              <span>
                {tr(
                  lang,
                  'Иллюстрация: симуляция NFC / QR-пропуска (демо)',
                  'Illustrative: NFC / QR pass simulation (demo)'
                )}
              </span>
            </div>
          </div>

          {/* Turnstile Access Simulation Bar */}
          <div className="p-4 bg-white dark:bg-[#171c26] border-t border-[#e2e4e8] dark:border-[#273142] text-center space-y-2">
            {turnstilePassed ? (
              <div className="p-3 rounded-full bg-[#ebfbee] dark:bg-[#16351d] text-[#166534] dark:text-[#45d320] text-xs font-heading font-semibold flex items-center justify-center space-x-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>
                  {tr(
                    lang,
                    'Проход через турникет разрешен! Приятного дня.',
                    'Turnstile access granted! Have a great day.'
                  )}
                </span>
              </div>
            ) : (
              <button
                onClick={handleNfcSimulate}
                disabled={isNfcTapping}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full btn-innopolis-primary text-xs font-heading font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Wifi className={`w-4 h-4 text-white ${isNfcTapping ? 'animate-ping' : ''}`} />
                <span>
                  {isNfcTapping
                    ? tr(lang, 'Симуляция считывания...', 'Simulating NFC read...')
                    : tr(
                        lang,
                        'Приложить к турникету (Симуляция NFC)',
                        'Tap at Turnstile (NFC Simulation)'
                      )}
                </span>
              </button>
            )}

            <p className="text-[10px] text-[#475569] dark:text-[#94a3b8] font-sans">
              {localizeText(UNIVERSITY_INFO.faculty, lang)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
