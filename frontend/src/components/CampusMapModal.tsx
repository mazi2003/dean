import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Navigation,
  Compass,
  Layers,
  CheckCircle2,
  Coffee,
  Users,
  Monitor,
  Wind,
  Footprints,
} from 'lucide-react';
import { tr } from '../utils/i18n';

interface RoomData {
  id: string;
  code: string;
  nameRu: string;
  nameEn: string;
  floor: number;
  wingRu: string;
  wingEn: string;
  capacity: number;
  equipmentRu: string[];
  equipmentEn: string[];
  amenitiesRu: string[];
  amenitiesEn: string[];
  walkTimeRu: string;
  walkTimeEn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number };
}

// Master Directory of Campus Rooms across 3 Floors
const CAMPUS_ROOMS: RoomData[] = [
  // ── FLOOR 1 ────────────────────────────────────────────────────────
  {
    id: 'hall-b',
    code: 'Конференц-зал Б',
    nameRu: 'Конференц-зал им. академика Сахарова',
    nameEn: 'Conference Hall B (Sakharov Hall)',
    floor: 1,
    wingRu: 'Центральный атриум • 1 этаж',
    wingEn: 'Central Atrium • Floor 1',
    capacity: 220,
    equipmentRu: ['Синхронный перевод', 'LED-видеостена 4K', 'Акустика Dolby Atmos'],
    equipmentEn: ['Simultaneous Translation', '4K LED Video Wall', 'Dolby Atmos Sound'],
    amenitiesRu: ['Главный гардероб (20 м)', 'Кафетерий (15 м)', 'Турникеты (30 м)'],
    amenitiesEn: ['Main Cloakroom (20 m)', 'Cafeteria (15 m)', 'Turnstiles (30 m)'],
    walkTimeRu: '30 сек от турникетов',
    walkTimeEn: '30 sec from turnstiles',
    x: 80,
    y: 80,
    w: 240,
    h: 140,
    door: { x: 200, y: 220 },
  },
  {
    id: 'a-101',
    code: 'А-101',
    nameRu: 'Большая поточная лекционная аудитория',
    nameEn: 'Grand Lecture Auditorium 101',
    floor: 1,
    wingRu: 'Западное крыло • 1 этаж',
    wingEn: 'West Wing • Floor 1',
    capacity: 150,
    equipmentRu: ['Парные лазерные проекторы', 'Микрофонные стойки', 'Wi-Fi 6 Eduroam'],
    equipmentEn: ['Dual Laser Projectors', 'Wireless Mics', 'Wi-Fi 6 Eduroam'],
    amenitiesRu: ['Лифтовой холл (35 м)', 'Кофе-поинт (25 м)', 'Санузлы (40 м)'],
    amenitiesEn: ['Elevator Hall (35 m)', 'Coffee Point (25 m)', 'Restrooms (40 m)'],
    walkTimeRu: '1 мин от турникетов',
    walkTimeEn: '1 min from turnstiles',
    x: 80,
    y: 260,
    w: 240,
    h: 120,
    door: { x: 200, y: 260 },
  },
  {
    id: 'e-102',
    code: 'Э-102',
    nameRu: 'Аудитория макроэкономического моделирования',
    nameEn: 'Macroeconomic Modeling Room 102',
    floor: 1,
    wingRu: 'Восточное крыло • 1 этаж',
    wingEn: 'East Wing • Floor 1',
    capacity: 60,
    equipmentRu: ['Интерактивная панель SMART', 'Кондиционирование', 'Терминалы данных'],
    equipmentEn: ['SMART Interactive Panel', 'Air Conditioning', 'Data Terminals'],
    amenitiesRu: ['Банкоматы и терминалы (10 м)', 'Студенческое кафе (30 м)'],
    amenitiesEn: ['ATMs & Kiosks (10 m)', 'Student Cafe (30 m)'],
    walkTimeRu: '45 сек от турникетов',
    walkTimeEn: '45 sec from turnstiles',
    x: 480,
    y: 80,
    w: 240,
    h: 130,
    door: { x: 600, y: 210 },
  },
  {
    id: 'cafe-1',
    code: 'Кафетерий',
    nameRu: 'Студенческий коворкинг и кофейня «Квант»',
    nameEn: 'Student Coworking & Coffee Hub "Quant"',
    floor: 1,
    wingRu: 'Восточное крыло • 1 этаж',
    wingEn: 'East Wing • Floor 1',
    capacity: 90,
    equipmentRu: ['Зоны для зарядки гаджетов', 'Быстрый Wi-Fi', 'Микроволновые печи'],
    equipmentEn: ['Device Charging Hubs', 'High-Speed Wi-Fi', 'Microwave Stations'],
    amenitiesRu: ['Кофе-бар (0 м)', 'Зона печати (10 м)', 'Турникеты (25 м)'],
    amenitiesEn: ['Coffee Bar (0 m)', 'Printing Hub (10 m)', 'Turnstiles (25 m)'],
    walkTimeRu: '25 сек от турникетов',
    walkTimeEn: '25 sec from turnstiles',
    x: 480,
    y: 250,
    w: 240,
    h: 130,
    door: { x: 600, y: 250 },
  },

  // ── FLOOR 2 ────────────────────────────────────────────────────────
  {
    id: 'comp-1',
    code: 'Комп-Класс 1',
    nameRu: 'Лаборатория вычислительных систем и Big Data',
    nameEn: 'Computing Systems & Big Data Lab 1',
    floor: 2,
    wingRu: 'Западное крыло • 2 этаж',
    wingEn: 'West Wing • Floor 2',
    capacity: 32,
    equipmentRu: ['32x станций Intel Core i9 / RTX 4080', 'Gigabit Ethernet', 'Два монитора 4K'],
    equipmentEn: ['32x Intel Core i9 / RTX 4080 rigs', 'Gigabit Ethernet', 'Dual 4K Displays'],
    amenitiesRu: ['Лифтовой холл (15 м)', 'Принт-зона (10 м)', 'Кулер с водой (5 м)'],
    amenitiesEn: ['Elevator Hall (15 m)', 'Printing Hub (10 m)', 'Water Station (5 m)'],
    walkTimeRu: '30 сек от лифта 2-го этажа',
    walkTimeEn: '30 sec from Floor 2 elevator',
    x: 80,
    y: 70,
    w: 240,
    h: 130,
    door: { x: 200, y: 200 },
  },
  {
    id: 'comp-3',
    code: 'Комп-Класс 3',
    nameRu: 'Лаборатория сетевой безопасности и DevOps',
    nameEn: 'Cybersecurity & Cloud Systems Lab 3',
    floor: 2,
    wingRu: 'Западное крыло • 2 этаж',
    wingEn: 'West Wing • Floor 2',
    capacity: 28,
    equipmentRu: ['Серверные стойки Cisco / MikroTik', 'Аппаратные ключи HSM', 'Шумоизоляция'],
    equipmentEn: ['Cisco / MikroTik Server Racks', 'Hardware HSM Keys', 'Acoustic Isolation'],
    amenitiesRu: ['Лифтовой холл (20 м)', 'Санузлы (35 м)'],
    amenitiesEn: ['Elevator Hall (20 m)', 'Restrooms (35 m)'],
    walkTimeRu: '45 сек от лифта 2-го этажа',
    walkTimeEn: '45 sec from Floor 2 elevator',
    x: 80,
    y: 240,
    w: 240,
    h: 140,
    door: { x: 200, y: 240 },
  },
  {
    id: 'lab-2',
    code: 'Лаб-2',
    nameRu: 'Лаборатория искусственного интеллекта и робототехники',
    nameEn: 'AI & Autonomous Robotics Laboratory 2',
    floor: 2,
    wingRu: 'Восточное крыло • 2 этаж',
    wingEn: 'East Wing • Floor 2',
    capacity: 25,
    equipmentRu: ['GPU-кластер NVIDIA A100', 'Тестовые полигоны дронов', 'Паяльные станции'],
    equipmentEn: ['NVIDIA A100 GPU Cluster', 'Drone Test Arena', 'Soldering Stations'],
    amenitiesRu: ['Медиатека (15 м)', 'Зона отдыха (20 м)', 'Лифт (25 м)'],
    amenitiesEn: ['Mediatheque (15 m)', 'Lounge Zone (20 m)', 'Elevator (25 m)'],
    walkTimeRu: '40 сек от лифта 2-го этажа',
    walkTimeEn: '40 sec from Floor 2 elevator',
    x: 480,
    y: 70,
    w: 240,
    h: 130,
    door: { x: 600, y: 200 },
  },
  {
    id: 'lingvo-4',
    code: 'Лингво-4',
    nameRu: 'Мультимедийный лингафонный кабинет',
    nameEn: 'Multimedia Language Center 4',
    floor: 2,
    wingRu: 'Восточное крыло • 2 этаж',
    wingEn: 'East Wing • Floor 2',
    capacity: 24,
    equipmentRu: ['Наушники Sennheiser с шумоподавлением', 'ПО синхронного перевода Trados'],
    equipmentEn: ['Sennheiser ANC Headsets', 'Trados Translation Suites'],
    amenitiesRu: ['Кофейный автомат (10 м)', 'Зона самоподготовки (20 м)'],
    amenitiesEn: ['Coffee Vending (10 m)', 'Self-Study Pods (20 m)'],
    walkTimeRu: '50 сек от лифта 2-го этажа',
    walkTimeEn: '50 sec from Floor 2 elevator',
    x: 480,
    y: 240,
    w: 240,
    h: 140,
    door: { x: 600, y: 240 },
  },

  // ── FLOOR 3 ────────────────────────────────────────────────────────
  {
    id: 'room-312',
    code: '312',
    nameRu: 'Единый деканат факультета международных отношений',
    nameEn: "Faculty Dean's Office & Student Advisory Center (Room 312)",
    floor: 3,
    wingRu: 'Центральный блок • 3 этаж',
    wingEn: 'Central Hub • Floor 3',
    capacity: 20,
    equipmentRu: ['Электронная очередь', 'МФУ оперативной печати справок', 'Кабинет приема'],
    equipmentEn: ['Smart Queue System', 'Express Document Printing Hub', 'Advisory Desks'],
    amenitiesRu: ['Центральный лифт (10 м)', 'Зона ожидания (5 м)', 'Инфокиоск (0 м)'],
    amenitiesEn: ['Central Elevator (10 m)', 'Waiting Lounge (5 m)', 'Kiosk (0 m)'],
    walkTimeRu: '20 сек от главного лифта 3-го этажа',
    walkTimeEn: '20 sec from Floor 3 main elevator',
    x: 280,
    y: 70,
    w: 240,
    h: 120,
    door: { x: 400, y: 190 },
  },
  {
    id: 'a-314',
    code: 'А-314',
    nameRu: 'Лаборатория прикладной математики и анализа данных (Пересдачи)',
    nameEn: 'Applied Mathematics & Data Analysis Lab (Retake Center)',
    floor: 3,
    wingRu: 'Западное крыло • 3 этаж',
    wingEn: 'West Wing • Floor 3',
    capacity: 45,
    equipmentRu: ['Мультимедиа-проектор 4K', '30 рабочих мест с R/Python', 'Кондиционер'],
    equipmentEn: ['4K Multimedia Projector', '30 R/Python Workstations', 'Climate Control'],
    amenitiesRu: ['Деканат ауд. 312 (20 м)', 'Лифт (15 м)', 'Кулер с водой (8 м)'],
    amenitiesEn: ["Dean's Office 312 (20 m)", 'Elevator (15 m)', 'Water Station (8 m)'],
    walkTimeRu: '35 сек от главного лифта 3-го этажа',
    walkTimeEn: '35 sec from Floor 3 main elevator',
    x: 80,
    y: 230,
    w: 240,
    h: 150,
    door: { x: 200, y: 230 },
  },
  {
    id: 'a-310',
    code: 'А-310',
    nameRu: 'Семинарская аудитория дипломатического анализа',
    nameEn: 'Diplomatic Analysis Seminar Room 310',
    floor: 3,
    wingRu: 'Западное крыло • 3 этаж',
    wingEn: 'West Wing • Floor 3',
    capacity: 35,
    equipmentRu: ['Круглый стол для дебатов', 'Видеоконференцсвязь (ВКС)', 'Интерактивная доска'],
    equipmentEn: ['Roundtable Debate Setup', 'High-Def Video Conferencing', 'Interactive Whiteboard'],
    amenitiesRu: ['Аудитория А-314 (15 м)', 'Лифтовой холл (25 м)'],
    amenitiesEn: ['Auditorium A-314 (15 m)', 'Elevator Hall (25 m)'],
    walkTimeRu: '45 сек от главного лифта 3-го этажа',
    walkTimeEn: '45 sec from Floor 3 main elevator',
    x: 80,
    y: 70,
    w: 180,
    h: 120,
    door: { x: 170, y: 190 },
  },
  {
    id: 'e-301',
    code: 'Э-301',
    nameRu: 'Аудитория мировых финансовых рынков',
    nameEn: 'Global Financial Markets Auditorium 301',
    floor: 3,
    wingRu: 'Восточное крыло • 3 этаж',
    wingEn: 'East Wing • Floor 3',
    capacity: 70,
    equipmentRu: ['Биржевой тикер Bloomberg', 'Двойной проектор', 'Wi-Fi 6 Eduroam'],
    equipmentEn: ['Bloomberg Market Ticker', 'Dual Projectors', 'Wi-Fi 6 Eduroam'],
    amenitiesRu: ['Деканат (35 м)', 'Кофе-поинт (15 м)', 'Санузлы (25 м)'],
    amenitiesEn: ["Dean's Office (35 m)", 'Coffee Point (15 m)', 'Restrooms (25 m)'],
    walkTimeRu: '40 сек от главного лифта 3-го этажа',
    walkTimeEn: '40 sec from Floor 3 main elevator',
    x: 540,
    y: 70,
    w: 180,
    h: 120,
    door: { x: 630, y: 190 },
  },
  {
    id: 'a-316',
    code: 'А-316',
    nameRu: 'Кафедра международного права и политологии',
    nameEn: 'Department of International Law & Political Studies',
    floor: 3,
    wingRu: 'Восточное крыло • 3 этаж',
    wingEn: 'East Wing • Floor 3',
    capacity: 25,
    equipmentRu: ['Преподавательские рабочие станции', 'Библиотека нормативных актов'],
    equipmentEn: ['Faculty Workstations', 'Legal Reference Archive'],
    amenitiesRu: ['Аудитория Э-301 (20 м)', 'Лифтовой холл (30 м)'],
    amenitiesEn: ['Auditorium E-301 (20 m)', 'Elevator Hall (30 m)'],
    walkTimeRu: '50 сек от главного лифта 3-го этажа',
    walkTimeEn: '50 sec from Floor 3 main elevator',
    x: 480,
    y: 230,
    w: 240,
    h: 150,
    door: { x: 600, y: 230 },
  },
];

interface CampusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomCode?: string | null;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
  isOpen,
  onClose,
  initialRoomCode,
}) => {
  const { lang } = useAuth();

  // Find matching room or default to A-314
  const targetRoom = useMemo(() => {
    if (!initialRoomCode) return CAMPUS_ROOMS.find((r) => r.code === 'А-314') || CAMPUS_ROOMS[0];
    const cleaned = initialRoomCode.toLowerCase().replace(/ауд\.?|комн\.?|каб\.?|\s+/g, '');
    const found = CAMPUS_ROOMS.find((r) => {
      const roomClean = r.code.toLowerCase().replace(/ауд\.?|комн\.?|каб\.?|\s+/g, '');
      return roomClean.includes(cleaned) || cleaned.includes(roomClean);
    });
    return found || CAMPUS_ROOMS.find((r) => r.code === 'А-314') || CAMPUS_ROOMS[0];
  }, [initialRoomCode]);

  const [selectedFloorOverride, setSelectedFloorOverride] = useState<number | null>(null);
  const [selectedRoomOverride, setSelectedRoomOverride] = useState<RoomData | null>(null);

  const selectedFloor = selectedFloorOverride ?? targetRoom.floor;
  const selectedRoom = selectedRoomOverride ?? targetRoom;

  const handleClose = useCallback(() => {
    setSelectedFloorOverride(null);
    setSelectedRoomOverride(null);
    onClose();
  }, [onClose]);

  // Keyboard close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  // Filter rooms for the current floor
  const floorRooms = CAMPUS_ROOMS.filter((r) => r.floor === selectedFloor);

  // Wayfinding route coordinates from the central elevator / stairs (x: 400, y: 215) to door
  const startPoint = { x: 400, y: 215 };
  const endPoint = selectedRoom.door;
  // Wayfinding path through central corridor (y: 215)
  const routePathD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campus-map-title"
    >
      <div className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ─────────────────────────────────────────────────────────────
            MODAL HEADER: Institutional Title & Floor Tabs
            ───────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 border-b border-[#e2e4e8] dark:border-[#273142] bg-[#f6f6f9] dark:bg-[#121620] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#161821] text-[#45d320] flex items-center justify-center shadow-xs flex-shrink-0">
              <Navigation className="w-5 h-5 text-[#45d320]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2
                  id="campus-map-title"
                  className="font-heading font-bold text-base sm:text-lg text-[#161821] dark:text-white"
                >
                  {tr(
                    lang,
                    'Интерактивная карта кампуса • Навигатор аудиторий',
                    'Interactive Campus Map • Indoor Wayfinding'
                  )}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#166534] text-white">
                  ГОСТ / 3D
                </span>
              </div>
              <p className="text-xs text-[#475569] dark:text-[#94a3b8] font-sans">
                {tr(
                  lang,
                  'Главный учебный корпус • Международный научно-технологический университет «ДемоТех»',
                  'Main Academic Complex • DemoTech University of Science & Technology'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* Floor Switcher */}
            <div className="flex items-center bg-white dark:bg-[#171c26] p-1 rounded-full border border-[#e2e4e8] dark:border-[#273142] shadow-xs">
              {[1, 2, 3].map((floor) => (
                <button
                  key={floor}
                  onClick={() => {
                    setSelectedFloorOverride(floor);
                    const firstInFloor = CAMPUS_ROOMS.find((r) => r.floor === floor);
                    if (firstInFloor) setSelectedRoomOverride(firstInFloor);
                  }}
                  className={`px-3 py-1.5 min-h-[36px] rounded-full text-xs font-heading font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                    selectedFloor === floor
                      ? 'bg-[#161821] text-white dark:bg-[#33b712] dark:text-white shadow-xs'
                      : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#161821] dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>
                    {floor} {lang === 'ru' ? 'этаж' : 'F'}
                  </span>
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 min-w-[44px] min-h-[44px] rounded-full text-[#475569] dark:text-[#94a3b8] hover:bg-[#ebeef3] dark:hover:bg-[#273142] transition-colors cursor-pointer flex items-center justify-center"
              aria-label={lang === 'ru' ? 'Закрыть карту' : 'Close map'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MODAL BODY: Interactive Architectural Floor Plan SVG
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Target Banner */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#ebfbee] dark:bg-[#16351d] border border-[#33b712]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-[#33b712] animate-ping" />
              <div>
                <span className="font-heading font-bold text-[#166534] dark:text-[#45d320] text-sm">
                  {selectedRoom.code} • {lang === 'ru' ? selectedRoom.nameRu : selectedRoom.nameEn}
                </span>
                <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1] font-sans">
                  {lang === 'ru' ? selectedRoom.wingRu : selectedRoom.wingEn} •{' '}
                  <span className="font-semibold text-[#166534] dark:text-[#45d320]">
                    {lang === 'ru' ? selectedRoom.walkTimeRu : selectedRoom.walkTimeEn}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white dark:bg-[#171c26] text-[#166534] dark:text-[#45d320] border border-[#33b712]/30 font-bold">
                Вместимость: {selectedRoom.capacity} чел.
              </span>
            </div>
          </div>

          {/* SVG Floor Plan Container */}
          <div className="relative bg-[#f8fafc] dark:bg-[#0f121a] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-2 sm:p-4 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between pb-2 px-2 text-[11px] font-mono text-[#475569] dark:text-[#94a3b8]">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span className="uppercase tracking-wider">
                  {lang === 'ru' ? `План ${selectedFloor}-го этажа` : `Floor ${selectedFloor} Layout`} • Главный корпус
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#33b712]" />
                  <span>{lang === 'ru' ? 'Выбранная аудитория' : 'Selected Room'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-[#166534] dark:border-[#45d320]" />
                  <span>{lang === 'ru' ? 'Пеший маршрут' : 'Walking Route'}</span>
                </span>
              </div>
            </div>

            {/* Architectural SVG Map */}
            <div className="w-full aspect-[800/420] min-h-[260px] select-none">
              <svg
                viewBox="0 0 800 420"
                className="w-full h-full font-sans"
                style={{ shapeRendering: 'geometricPrecision' }}
              >
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-[#e2e4e8]/40 dark:text-[#273142]/40"
                    />
                  </pattern>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#166534" />
                    <stop offset="100%" stopColor="#45d320" />
                  </linearGradient>
                </defs>

                <rect width="800" height="420" fill="url(#grid)" />

                {/* Building Outer Perimeter Walls */}
                <rect
                  x="40"
                  y="40"
                  width="720"
                  height="340"
                  rx="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-[#94a3b8] dark:text-[#334155]"
                />

                {/* Central Hallway / Corridor */}
                <rect
                  x="50"
                  y="200"
                  width="700"
                  height="30"
                  fill="currentColor"
                  className="text-[#e2e4e8]/60 dark:text-[#171c26]/80"
                />

                {/* Vertical Connector Hub */}
                <rect
                  x="370"
                  y="50"
                  width="60"
                  height="320"
                  fill="currentColor"
                  className="text-[#e2e4e8]/40 dark:text-[#171c26]/60"
                />

                {/* Central Elevator & Stairs Hub (Origin of Wayfinding) */}
                <g transform="translate(375, 195)">
                  <rect
                    x="0"
                    y="0"
                    width="50"
                    height="40"
                    rx="8"
                    fill="#161821"
                    stroke="#33b712"
                    strokeWidth="1.5"
                  />
                  <text
                    x="25"
                    y="18"
                    textAnchor="middle"
                    fill="#45d320"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    ЛИФТ
                  </text>
                  <text
                    x="25"
                    y="30"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="7"
                    fontFamily="sans-serif"
                  >
                    СТАРТ
                  </text>
                </g>

                {/* Static Facilities / Icons on Current Floor */}
                <g transform="translate(330, 203)">
                  <rect x="0" y="0" width="30" height="24" rx="4" fill="#64748b" opacity="0.3" />
                  <text x="15" y="16" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold">
                    WC
                  </text>
                </g>
                <g transform="translate(440, 203)">
                  <rect x="0" y="0" width="30" height="24" rx="4" fill="#0284c7" opacity="0.2" />
                  <text x="15" y="16" textAnchor="middle" fill="#0284c7" fontSize="8" fontWeight="bold">
                    H2O
                  </text>
                </g>

                {/* Render Rooms for Selected Floor */}
                {floorRooms.map((room) => {
                  const isSelected = selectedRoom.id === room.id;
                  return (
                    <g
                      key={room.id}
                      onClick={() => setSelectedRoomOverride(room)}
                      className="cursor-pointer transition-all duration-200 group"
                      tabIndex={0}
                      role="button"
                      aria-label={`${room.code}: ${room.nameRu}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedRoomOverride(room);
                        }
                      }}
                    >
                      {/* Room Block */}
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.w}
                        height={room.h}
                        rx="12"
                        className={`transition-all duration-300 ${
                          isSelected
                            ? 'fill-[#33b712]/20 dark:fill-[#33b712]/30 stroke-[#33b712] stroke-[3px] filter drop-shadow-md'
                            : 'fill-white dark:fill-[#1e2533] stroke-[#cbd5e1] dark:stroke-[#334155] stroke-[1.5px] hover:stroke-[#33b712]/70 hover:fill-[#f1f5f9] dark:hover:fill-[#273142]'
                        }`}
                      />

                      {/* Door Indicator */}
                      <circle
                        cx={room.door.x}
                        cy={room.door.y}
                        r={isSelected ? 5 : 3.5}
                        className={
                          isSelected
                            ? 'fill-[#166534] dark:fill-[#45d320] stroke-white stroke-2'
                            : 'fill-[#94a3b8] dark:fill-[#475569]'
                        }
                      />

                      {/* Room Code Header */}
                      <text
                        x={room.x + 16}
                        y={room.y + 28}
                        className={`font-mono text-sm font-bold ${
                          isSelected
                            ? 'fill-[#166534] dark:fill-[#45d320]'
                            : 'fill-[#161821] dark:fill-white'
                        }`}
                      >
                        {room.code}
                      </text>

                      {/* Room Formal Name Label */}
                      <text
                        x={room.x + 16}
                        y={room.y + 48}
                        className="text-[10px] font-sans fill-[#475569] dark:fill-[#cbd5e1] max-w-[200px]"
                      >
                        {lang === 'ru'
                          ? room.nameRu.slice(0, 32) + (room.nameRu.length > 32 ? '…' : '')
                          : room.nameEn.slice(0, 32) + (room.nameEn.length > 32 ? '…' : '')}
                      </text>

                      {/* Capacity tag in Room */}
                      <text
                        x={room.x + 16}
                        y={room.y + 68}
                        className="text-[9px] font-mono fill-[#64748b] dark:fill-[#94a3b8]"
                      >
                        {room.capacity} мест • {selectedFloor} эт.
                      </text>

                      {/* Animated Beacon Pin when Selected */}
                      {isSelected && (
                        <g transform={`translate(${room.x + room.w - 36}, ${room.y + 14})`}>
                          <circle cx="12" cy="12" r="14" fill="#33b712" opacity="0.3" className="animate-ping" />
                          <circle cx="12" cy="12" r="10" fill="#166534" />
                          <circle cx="12" cy="12" r="4" fill="#ffffff" />
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Animated Walking Route Path Line */}
                <path
                  d={routePathD}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                  strokeLinecap="round"
                  className="animate-dash"
                  style={{
                    animation: 'dashAnimation 1.5s linear infinite',
                  }}
                />

                {/* Destination Flag Icon at Door */}
                <circle
                  cx={endPoint.x}
                  cy={endPoint.y}
                  r="6"
                  fill="#be123c"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="animate-bounce"
                />
              </svg>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              ROOM DOSSIER: Equipment, Amenities & Direct Wayfinding Guide
              ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Equipment Card */}
            <div className="p-4 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-2">
              <div className="flex items-center space-x-2 text-xs font-heading font-semibold text-[#161821] dark:text-white">
                <Monitor className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>{tr(lang, 'Оснащение аудитории', 'Room Facilities')}</span>
              </div>
              <ul className="text-xs text-[#475569] dark:text-[#cbd5e1] space-y-1 font-sans">
                {(lang === 'ru' ? selectedRoom.equipmentRu : selectedRoom.equipmentEn).map(
                  (eq, idx) => (
                    <li key={idx} className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534] dark:bg-[#45d320]" />
                      <span>{eq}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Nearby Amenities Card */}
            <div className="p-4 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-2">
              <div className="flex items-center space-x-2 text-xs font-heading font-semibold text-[#161821] dark:text-white">
                <Coffee className="w-4 h-4 text-[#b45309] dark:text-[#fbbf24]" />
                <span>{tr(lang, 'Ближайшие сервисы', 'Nearby Amenities')}</span>
              </div>
              <ul className="text-xs text-[#475569] dark:text-[#cbd5e1] space-y-1 font-sans">
                {(lang === 'ru' ? selectedRoom.amenitiesRu : selectedRoom.amenitiesEn).map(
                  (am, idx) => (
                    <li key={idx} className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
                      <span>{am}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Quick Wayfinding Summary Card */}
            <div className="p-4 rounded-2xl bg-[#161821] text-white border border-[#33b712]/40 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-xs font-heading font-semibold text-[#45d320]">
                  <Footprints className="w-4 h-4 text-[#45d320]" />
                  <span>{tr(lang, 'Маршрут построен', 'Route Ready')}</span>
                </div>
                <p className="text-xs text-white/80 font-sans mt-1 leading-relaxed">
                  {lang === 'ru'
                    ? `Следуйте по центральному коридору ${selectedFloor}-го этажа. Путь занимает ${selectedRoom.walkTimeRu}.`
                    : `Follow the central corridor on Floor ${selectedFloor}. Walking distance is ${selectedRoom.walkTimeEn}.`}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#45d320]">
                <span>{selectedRoom.code} • ДОСТУПНО</span>
                <span className="flex items-center space-x-1">
                  <Wind className="w-3.5 h-3.5" />
                  <span>Климат-контроль</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MODAL FOOTER: Close & Return to Timetable
            ───────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-[#e2e4e8] dark:border-[#273142] bg-[#f6f6f9] dark:bg-[#121620] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-[11px] text-[#475569] dark:text-[#94a3b8] font-sans flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <span>
              {tr(
                lang,
                'Карта обновлена по регламенту осенне-весенней сессии 2026 г.',
                'Map synchronized with Spring 2026 Academic Timetable.'
              )}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] rounded-full btn-innopolis-primary text-xs font-heading font-semibold transition-all cursor-pointer shadow-md text-center"
          >
            {tr(lang, 'Вернуться к расписанию', 'Back to Timetable')}
          </button>
        </div>
      </div>
    </div>
  );
};
