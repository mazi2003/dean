import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Navigation,
  Compass,
  Layers,
  Users,
  Monitor,
  Wind,
  Footprints,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Clock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { tr } from '../utils/i18n';

interface RoomData {
  id: string;
  code: string;
  codeEn: string;
  nameRu: string;
  nameEn: string;
  floor: number;
  category: 'entrance' | 'elevator' | 'room';
  wingRu: string;
  wingEn: string;
  capacity: number;
  equipmentRu: string[];
  equipmentEn: string[];
  amenitiesRu: string[];
  amenitiesEn: string[];
  walkTimeRu: string;
  walkTimeEn: string;
  // SVG bounding box coordinates (viewBox 0 0 800 420)
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number };
}

// Master Directory of Campus Rooms & Entrances across 3 Floors
const CAMPUS_ROOMS: RoomData[] = [
  // ── FLOOR 1 ────────────────────────────────────────────────────────
  {
    id: 'turnstiles',
    code: 'Главный вход / Турникеты',
    codeEn: 'Main Entrance / Turnstiles',
    nameRu: 'Главный вход и турникетный пропускной комплекс кампуса',
    nameEn: 'Campus Main Entrance & NFC Turnstile Hub',
    floor: 1,
    category: 'entrance',
    wingRu: 'Центральный вестибюль • 1 этаж',
    wingEn: 'Central Vestibule • Floor 1',
    capacity: 500,
    equipmentRu: ['Турникеты с NFC и оптическим QR', 'Служба безопасности', 'Бюро пропусков'],
    equipmentEn: ['NFC & Optical QR Turnstiles', 'Campus Security', 'Pass Issuance Desk'],
    amenitiesRu: ['Главный гардероб (10 м)', 'Инфокиоск (5 м)', 'Банкоматы (15 м)'],
    amenitiesEn: ['Main Cloakroom (10 m)', 'Info Kiosk (5 m)', 'ATMs (15 m)'],
    walkTimeRu: '0 сек (Точка входа)',
    walkTimeEn: '0 sec (Entry Point)',
    x: 340,
    y: 310,
    w: 120,
    h: 55,
    door: { x: 400, y: 310 },
  },
  {
    id: 'elevator-1',
    code: 'Центральный лифт (1 эт.)',
    codeEn: 'Central Elevator (1F)',
    nameRu: 'Центральный лифтовой холл и лестница №1 (1 этаж)',
    nameEn: 'Central Elevator Hub & Stairwell #1 (Floor 1)',
    floor: 1,
    category: 'elevator',
    wingRu: 'Центральный атриум • 1 этаж',
    wingEn: 'Central Atrium • Floor 1',
    capacity: 60,
    equipmentRu: ['3х скоростных лифта', 'Лестница №1', 'Навигационная стела'],
    equipmentEn: ['3x Express Elevators', 'Stairwell #1', 'Directory Board'],
    amenitiesRu: ['Турникеты (20 м)', 'Кафетерий (15 м)', 'Санузлы (30 м)'],
    amenitiesEn: ['Turnstiles (20 m)', 'Cafeteria (15 m)', 'Restrooms (30 m)'],
    walkTimeRu: '20 сек от турникетов',
    walkTimeEn: '20 sec from turnstiles',
    x: 375,
    y: 195,
    w: 50,
    h: 40,
    door: { x: 400, y: 215 },
  },
  {
    id: 'hall-b',
    code: 'Конференц-зал Б',
    codeEn: 'Conference Hall B',
    nameRu: 'Конференц-зал им. академика Сахарова',
    nameEn: 'Conference Hall B (Sakharov Hall)',
    floor: 1,
    category: 'room',
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
    h: 110,
    door: { x: 200, y: 190 },
  },
  {
    id: 'a-101',
    code: 'А-101',
    codeEn: 'A-101',
    nameRu: 'Большая поточная лекционная аудитория',
    nameEn: 'Grand Lecture Auditorium 101',
    floor: 1,
    category: 'room',
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
    y: 250,
    w: 240,
    h: 115,
    door: { x: 200, y: 250 },
  },
  {
    id: 'e-102',
    code: 'Э-102',
    codeEn: 'E-102',
    nameRu: 'Аудитория макроэкономического моделирования',
    nameEn: 'Macroeconomic Modeling Room 102',
    floor: 1,
    category: 'room',
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
    h: 110,
    door: { x: 600, y: 190 },
  },
  {
    id: 'cafe-1',
    code: 'Кафетерий',
    codeEn: 'Cafeteria',
    nameRu: 'Студенческий коворкинг и кофейня «Квант»',
    nameEn: 'Student Coworking & Coffee Hub "Quant"',
    floor: 1,
    category: 'room',
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
    h: 115,
    door: { x: 600, y: 250 },
  },

  // ── FLOOR 2 ────────────────────────────────────────────────────────
  {
    id: 'elevator-2',
    code: 'Центральный лифт (2 эт.)',
    codeEn: 'Central Elevator (2F)',
    nameRu: 'Центральный лифтовой холл и лестница №1 (2 этаж)',
    nameEn: 'Central Elevator Hub & Stairwell #1 (Floor 2)',
    floor: 2,
    category: 'elevator',
    wingRu: 'Центральный атриум • 2 этаж',
    wingEn: 'Central Atrium • Floor 2',
    capacity: 60,
    equipmentRu: ['3х скоростных лифта', 'Лестница №1', 'Навигационная панель'],
    equipmentEn: ['3x Express Elevators', 'Stairwell #1', 'Directory Board'],
    amenitiesRu: ['Комп-Класс 1 (15 м)', 'Лаб-2 (25 м)', 'Принт-зона (10 м)'],
    amenitiesEn: ['Computing Lab 1 (15 m)', 'Lab 2 (25 m)', 'Printing Hub (10 m)'],
    walkTimeRu: '15 сек от лифта',
    walkTimeEn: '15 sec from elevator',
    x: 375,
    y: 195,
    w: 50,
    h: 40,
    door: { x: 400, y: 215 },
  },
  {
    id: 'comp-1',
    code: 'Комп-Класс 1',
    codeEn: 'Computer Lab 1',
    nameRu: 'Лаборатория вычислительных систем и Big Data',
    nameEn: 'Computing Systems & Big Data Lab 1',
    floor: 2,
    category: 'room',
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
    y: 75,
    w: 240,
    h: 115,
    door: { x: 200, y: 190 },
  },
  {
    id: 'comp-3',
    code: 'Комп-Класс 3',
    codeEn: 'Computer Lab 3',
    nameRu: 'Лаборатория сетевой безопасности и DevOps',
    nameEn: 'Cybersecurity & Cloud Systems Lab 3',
    floor: 2,
    category: 'room',
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
    y: 245,
    w: 240,
    h: 120,
    door: { x: 200, y: 245 },
  },
  {
    id: 'lab-2',
    code: 'Лаб-2',
    codeEn: 'Lab-2',
    nameRu: 'Лаборатория искусственного интеллекта и робототехники',
    nameEn: 'AI & Autonomous Robotics Laboratory 2',
    floor: 2,
    category: 'room',
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
    y: 75,
    w: 240,
    h: 115,
    door: { x: 600, y: 190 },
  },
  {
    id: 'lingvo-4',
    code: 'Лингво-4',
    codeEn: 'Linguo-4',
    nameRu: 'Мультимедийный лингафонный кабинет',
    nameEn: 'Multimedia Language Center 4',
    floor: 2,
    category: 'room',
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
    y: 245,
    w: 240,
    h: 120,
    door: { x: 600, y: 245 },
  },

  // ── FLOOR 3 ────────────────────────────────────────────────────────
  {
    id: 'elevator-3',
    code: 'Центральный лифт (3 эт.)',
    codeEn: 'Central Elevator (3F)',
    nameRu: 'Центральный лифтовой холл и лестница №1 (3 этаж)',
    nameEn: 'Central Elevator Hub & Stairwell #1 (Floor 3)',
    floor: 3,
    category: 'elevator',
    wingRu: 'Центральный атриум • 3 этаж',
    wingEn: 'Central Atrium • Floor 3',
    capacity: 60,
    equipmentRu: ['3х скоростных лифта', 'Лестница №1', 'Навигационная стела'],
    equipmentEn: ['3x Express Elevators', 'Stairwell #1', 'Directory Board'],
    amenitiesRu: ['Деканат ауд. 312 (10 м)', 'Ауд. А-314 (15 м)', 'Зона кофе (15 м)'],
    amenitiesEn: ["Dean's Office 312 (10 m)", 'Room A-314 (15 m)', 'Coffee Point (15 m)'],
    walkTimeRu: '10 сек от лифта',
    walkTimeEn: '10 sec from elevator',
    x: 375,
    y: 195,
    w: 50,
    h: 40,
    door: { x: 400, y: 215 },
  },
  {
    id: 'room-312',
    code: '312',
    codeEn: '312',
    nameRu: 'Единый деканат факультета международных отношений',
    nameEn: "Faculty Dean's Office & Student Advisory Center (Room 312)",
    floor: 3,
    category: 'room',
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
    h: 115,
    door: { x: 400, y: 185 },
  },
  {
    id: 'a-314',
    code: 'А-314',
    codeEn: 'A-314',
    nameRu: 'Лаборатория прикладной математики и анализа данных (Пересдачи)',
    nameEn: 'Applied Mathematics & Data Analysis Lab (Retake Center)',
    floor: 3,
    category: 'room',
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
    y: 245,
    w: 240,
    h: 120,
    door: { x: 200, y: 245 },
  },
  {
    id: 'a-310',
    code: 'А-310',
    codeEn: 'A-310',
    nameRu: 'Семинарская аудитория дипломатического анализа',
    nameEn: 'Diplomatic Analysis Seminar Room 310',
    floor: 3,
    category: 'room',
    wingRu: 'Западное крыло • 3 этаж',
    wingEn: 'West Wing • Floor 3',
    capacity: 35,
    equipmentRu: ['Круглый стол для дебатов', 'Видеоконференцсвязь (ВКС)', 'Интерактивная доска'],
    equipmentEn: [
      'Roundtable Debate Setup',
      'High-Def Video Conferencing',
      'Interactive Whiteboard',
    ],
    amenitiesRu: ['Аудитория А-314 (15 м)', 'Лифтовой холл (25 м)'],
    amenitiesEn: ['Auditorium A-314 (15 m)', 'Elevator Hall (25 m)'],
    walkTimeRu: '45 сек от главного лифта 3-го этажа',
    walkTimeEn: '45 sec from Floor 3 main elevator',
    x: 80,
    y: 70,
    w: 180,
    h: 115,
    door: { x: 170, y: 185 },
  },
  {
    id: 'e-301',
    code: 'Э-301',
    codeEn: 'E-301',
    nameRu: 'Аудитория мировых финансовых рынков',
    nameEn: 'Global Financial Markets Auditorium 301',
    floor: 3,
    category: 'room',
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
    h: 115,
    door: { x: 630, y: 185 },
  },
  {
    id: 'a-316',
    code: 'А-316',
    codeEn: 'A-316',
    nameRu: 'Кафедра международного права и политологии',
    nameEn: 'Department of International Law & Political Studies',
    floor: 3,
    category: 'room',
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
    y: 245,
    w: 240,
    h: 120,
    door: { x: 600, y: 245 },
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

  // Find matching destination room or default to A-314
  const targetRoom = useMemo(() => {
    if (!initialRoomCode) return CAMPUS_ROOMS.find((r) => r.code === 'А-314') || CAMPUS_ROOMS[0];
    const cleaned = initialRoomCode.toLowerCase().replace(/ауд\.?|комн\.?|каб\.?|\s+/g, '');
    const found = CAMPUS_ROOMS.find((r) => {
      const roomClean = r.code.toLowerCase().replace(/ауд\.?|комн\.?|каб\.?|\s+/g, '');
      const roomEnClean = r.codeEn.toLowerCase().replace(/rm\.?|\s+/g, '');
      return (
        roomClean.includes(cleaned) || cleaned.includes(roomClean) || roomEnClean.includes(cleaned)
      );
    });
    return found || CAMPUS_ROOMS.find((r) => r.code === 'А-314') || CAMPUS_ROOMS[0];
  }, [initialRoomCode]);

  const [originId, setOriginId] = useState<string>('turnstiles');
  const [destinationOverride, setDestinationOverride] = useState<{
    forTargetId: string;
    destId: string;
  } | null>(null);
  const [selectedFloorState, setSelectedFloorState] = useState<{
    forTargetId: string;
    floor: number | null;
  } | null>(null);
  const [mobileZoom, setMobileZoom] = useState<boolean>(false);

  const destinationId =
    destinationOverride && destinationOverride.forTargetId === targetRoom.id
      ? destinationOverride.destId
      : targetRoom.id;

  const setDestinationId = useCallback(
    (nextId: string) => {
      setDestinationOverride({ forTargetId: targetRoom.id, destId: nextId });
    },
    [targetRoom.id]
  );

  const selectedFloorOverride =
    selectedFloorState && selectedFloorState.forTargetId === targetRoom.id
      ? selectedFloorState.floor
      : null;

  const setSelectedFloorOverride = useCallback(
    (nextFloor: number | null) => {
      setSelectedFloorState({ forTargetId: targetRoom.id, floor: nextFloor });
    },
    [targetRoom.id]
  );

  const originLocation = useMemo(
    () => CAMPUS_ROOMS.find((r) => r.id === originId) || CAMPUS_ROOMS[0],
    [originId]
  );

  const destLocation = useMemo(
    () => CAMPUS_ROOMS.find((r) => r.id === destinationId) || targetRoom,
    [destinationId, targetRoom]
  );

  const selectedFloor = selectedFloorOverride ?? destLocation.floor;
  const floorDiff = destLocation.floor - originLocation.floor;

  const getRoomCode = (r: RoomData) => (lang === 'ru' ? r.code : r.codeEn);

  const handleClose = useCallback(() => {
    setSelectedFloorOverride(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSwap = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
    setSelectedFloorOverride(null);
  };

  if (!isOpen) return null;

  const floorRooms = CAMPUS_ROOMS.filter((r) => r.floor === selectedFloor && r.category === 'room');

  // ── DYNAMIC SVG ROUTE PATH CALCULATION ──────────────────────────────
  let routePathD = '';
  const centralElevatorPoint = { x: 400, y: 215 };

  if (originLocation.floor === destLocation.floor) {
    if (selectedFloor === destLocation.floor) {
      const p1 = originLocation.door;
      const p2 = destLocation.door;
      routePathD = `M ${p1.x} ${p1.y} L ${p1.x} 215 L ${p2.x} 215 L ${p2.x} ${p2.y}`;
    }
  } else {
    if (selectedFloor === originLocation.floor) {
      const p1 = originLocation.door;
      routePathD = `M ${p1.x} ${p1.y} L ${p1.x} 215 L ${centralElevatorPoint.x} 215`;
    } else if (selectedFloor === destLocation.floor) {
      const p2 = destLocation.door;
      routePathD = `M ${centralElevatorPoint.x} 215 L ${p2.x} 215 L ${p2.x} ${p2.y}`;
    } else {
      routePathD = `M 390 215 L 410 215`;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campus-map-title"
    >
      <div className="bg-white dark:bg-[#171c26] rounded-t-3xl sm:rounded-3xl border border-[#e2e4e8] dark:border-[#273142] w-full max-w-5xl h-[94dvh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ─────────────────────────────────────────────────────────────
            1. PINNED COMPACT MODAL HEADER
            ───────────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 sm:p-5 border-b border-[#e2e4e8] dark:border-[#273142] bg-[#f6f6f9] dark:bg-[#121620] flex items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#161821] text-[#45d320] flex items-center justify-center shadow-xs flex-shrink-0">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-[#45d320]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2
                  id="campus-map-title"
                  className="font-heading font-bold text-sm sm:text-lg text-[#161821] dark:text-white truncate"
                >
                  {tr(
                    lang,
                    'Интерактивная карта кампуса и навигация (Wayfinding)',
                    'Interactive Campus Map & Indoor Wayfinding'
                  )}
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#166534] text-white flex-shrink-0">
                  {tr(lang, '3D Маршрутизация', '3D Wayfinding')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#475569] dark:text-[#94a3b8] font-sans truncate">
                {tr(
                  lang,
                  'Главный учебный корпус • Построение маршрутов и переходы между этажами',
                  'Main Academic Building • Smart Routing & Floor Transitions'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 min-w-[44px] min-h-[44px] rounded-full text-[#475569] dark:text-[#94a3b8] hover:bg-[#ebeef3] dark:hover:bg-[#273142] transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
            aria-label={lang === 'ru' ? 'Закрыть карту' : 'Close map'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. UNIFIED SCROLLABLE BODY (Controls + SVG Map + Room Pills + Steps)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          {/* Route Planner Controls */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#f6f6f9]/70 dark:bg-[#151a24] border border-[#e2e4e8] dark:border-[#273142] space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
              {/* Origin Dropdown */}
              <div className="md:col-span-5 space-y-1 min-w-0">
                <label
                  htmlFor="campus-origin-select"
                  className="text-[11px] font-heading font-semibold text-[#166534] dark:text-[#45d320] flex items-center space-x-1.5 uppercase tracking-wider"
                >
                  <span className="w-2 h-2 rounded-full bg-[#166534] dark:bg-[#45d320] flex-shrink-0" />
                  <span className="truncate">
                    {tr(
                      lang,
                      'Откуда (Точка отправления / Вход)',
                      'From (Starting Point / Entrance)'
                    )}
                  </span>
                </label>
                <select
                  id="campus-origin-select"
                  value={originId}
                  onChange={(e) => {
                    setOriginId(e.target.value);
                    setSelectedFloorOverride(null);
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] text-xs font-sans text-[#161821] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#33b712] cursor-pointer"
                >
                  <optgroup label={lang === 'ru' ? 'Входы и турникеты' : 'Entrances & Gateways'}>
                    {CAMPUS_ROOMS.filter((r) => r.category === 'entrance').map((r) => (
                      <option key={r.id} value={r.id}>
                        🏛️ {getRoomCode(r)} ({r.floor} {lang === 'ru' ? 'этаж' : 'F'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label={lang === 'ru' ? 'Лифтовые узлы и лестницы' : 'Elevator Hubs & Stairs'}
                  >
                    {CAMPUS_ROOMS.filter((r) => r.category === 'elevator').map((r) => (
                      <option key={r.id} value={r.id}>
                        🛗 {getRoomCode(r)} ({r.floor} {lang === 'ru' ? 'этаж' : 'F'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label={lang === 'ru' ? 'Аудитории и лаборатории (1 этаж)' : 'Floor 1 Rooms'}
                  >
                    {CAMPUS_ROOMS.filter((r) => r.floor === 1 && r.category === 'room').map((r) => (
                      <option key={r.id} value={r.id}>
                        🚪 {getRoomCode(r)} — {lang === 'ru' ? r.nameRu : r.nameEn}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label={lang === 'ru' ? 'Аудитории и лаборатории (2 этаж)' : 'Floor 2 Rooms'}
                  >
                    {CAMPUS_ROOMS.filter((r) => r.floor === 2 && r.category === 'room').map((r) => (
                      <option key={r.id} value={r.id}>
                        🚪 {getRoomCode(r)} — {lang === 'ru' ? r.nameRu : r.nameEn}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label={lang === 'ru' ? 'Аудитории и деканат (3 этаж)' : 'Floor 3 Rooms'}
                  >
                    {CAMPUS_ROOMS.filter((r) => r.floor === 3 && r.category === 'room').map((r) => (
                      <option key={r.id} value={r.id}>
                        🚪 {getRoomCode(r)} — {lang === 'ru' ? r.nameRu : r.nameEn}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-full bg-white dark:bg-[#1e2533] hover:bg-[#ebeef3] dark:hover:bg-[#273142] text-[#161821] dark:text-white border border-[#e2e4e8] dark:border-[#273142] transition-transform active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                  title={tr(lang, 'Поменять местами старт и финиш', 'Swap origin and destination')}
                  aria-label="Swap route direction"
                >
                  <ArrowUpDown className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                  <span className="md:hidden text-[11px] font-sans font-medium">
                    {tr(lang, 'Обратный маршрут', 'Reverse route')}
                  </span>
                </button>
              </div>

              {/* Destination Dropdown */}
              <div className="md:col-span-5 space-y-1 min-w-0">
                <label
                  htmlFor="campus-destination-select"
                  className="text-[11px] font-heading font-semibold text-[#be123c] dark:text-[#fecdd3] flex items-center space-x-1.5 uppercase tracking-wider"
                >
                  <span className="w-2 h-2 rounded-full bg-[#be123c] dark:bg-[#fecdd3] flex-shrink-0" />
                  <span className="truncate">
                    {tr(lang, 'Куда (Точка назначения / Аудитория)', 'To (Destination Room)')}
                  </span>
                </label>
                <select
                  id="campus-destination-select"
                  value={destinationId}
                  onChange={(e) => {
                    setDestinationId(e.target.value);
                    setSelectedFloorOverride(null);
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] text-xs font-sans text-[#161821] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#be123c] cursor-pointer"
                >
                  <optgroup
                    label={lang === 'ru' ? 'Аудитории и деканат (3 этаж)' : 'Floor 3 Rooms'}
                  >
                    {CAMPUS_ROOMS.filter((r) => r.floor === 3 && r.category === 'room').map((r) => (
                      <option key={r.id} value={r.id}>
                        🚪 {getRoomCode(r)} — {lang === 'ru' ? r.nameRu : r.nameEn}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label={lang === 'ru' ? 'Аудитории и лаборатории (2 этаж)' : 'Floor 2 Rooms'}
                  >
                    {CAMPUS_ROOMS.filter((r) => r.floor === 2 && r.category === 'room').map((r) => (
                      <option key={r.id} value={r.id}>
                        🚪 {getRoomCode(r)} — {lang === 'ru' ? r.nameRu : r.nameEn}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={lang === 'ru' ? 'Аудитории и залы (1 этаж)' : 'Floor 1 Rooms'}>
                    {CAMPUS_ROOMS.filter((r) => r.floor === 1 && r.category === 'room').map((r) => (
                      <option key={r.id} value={r.id}>
                        🚪 {getRoomCode(r)} — {lang === 'ru' ? r.nameRu : r.nameEn}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={lang === 'ru' ? 'Входы и лифты' : 'Hubs & Entrances'}>
                    {CAMPUS_ROOMS.filter((r) => r.category !== 'room').map((r) => (
                      <option key={r.id} value={r.id}>
                        📍 {getRoomCode(r)} ({r.floor} {lang === 'ru' ? 'этаж' : 'F'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Vertical Transition Banner */}
            <div
              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs ${
                floorDiff > 0
                  ? 'bg-gradient-to-r from-[#fffbeb] via-[#fef3c7]/60 to-[#ecfdf5] dark:from-[#3a280c] dark:via-[#2b1f0c] dark:to-[#162f1c] border-[#f59e0b]'
                  : floorDiff < 0
                    ? 'bg-gradient-to-r from-[#eff6ff] via-[#e0f2fe]/60 to-[#f0fdf4] dark:from-[#0c233a] dark:via-[#0e1d2c] dark:to-[#162f1c] border-[#38bdf8]'
                    : 'bg-[#ebfbee] dark:bg-[#16351d] border-[#33b712]/40'
              }`}
            >
              <div className="flex items-start sm:items-center space-x-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                    floorDiff > 0
                      ? 'bg-[#d97706] text-white'
                      : floorDiff < 0
                        ? 'bg-[#0284c7] text-white'
                        : 'bg-[#166534] text-white'
                  }`}
                >
                  {floorDiff > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  ) : floorDiff < 0 ? (
                    <ArrowDownRight className="w-4 h-4 text-white" />
                  ) : (
                    <Footprints className="w-4 h-4 text-white" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-heading font-bold text-xs text-[#161821] dark:text-white">
                      {floorDiff > 0
                        ? tr(
                            lang,
                            `🔺 ТРЕБУЕТСЯ ПОДЪЕМ: +${floorDiff} ЭТАЖА (С ${originLocation.floor} НА ${destLocation.floor} ЭТАЖ)`,
                            `🔺 ASCENT REQUIRED: +${floorDiff} FLOOR(S) (FLOOR ${originLocation.floor} → ${destLocation.floor})`
                          )
                        : floorDiff < 0
                          ? tr(
                              lang,
                              `🔻 ТРЕБУЕТСЯ СПУСК: -${Math.abs(floorDiff)} ЭТАЖА (С ${originLocation.floor} НА ${destLocation.floor} ЭТАЖ)`,
                              `🔻 DESCENT REQUIRED: -${Math.abs(floorDiff)} FLOOR(S) (FLOOR ${originLocation.floor} → ${destLocation.floor})`
                            )
                          : tr(
                              lang,
                              `➡️ МАРШРУТ НА ${destLocation.floor}-М ЭТАЖЕ (БЕЗ СМЕНЫ УРОВНЯ)`,
                              `➡️ DIRECT ROUTE ON FLOOR ${destLocation.floor} (SAME LEVEL)`
                            )}
                    </span>
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#161821] text-white">
                      {floorDiff !== 0
                        ? tr(lang, 'ЛЕСТНИЦА / ЛИФТ', 'STAIRS / ELEVATOR')
                        : tr(lang, 'БЕЗ ЛЕСТНИЦ', 'NO STAIRS')}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1] font-sans mt-0.5 leading-snug">
                    {floorDiff > 0
                      ? tr(
                          lang,
                          `Поднимитесь на лифте или лестнице №1 в атриуме на ${destLocation.floor}-й этаж к ${getRoomCode(destLocation)} (~1 мин 20 сек).`,
                          `Take the central elevator or Stairwell #1 in the atrium up to Floor ${destLocation.floor} to ${getRoomCode(destLocation)} (~1 min 20 sec).`
                        )
                      : floorDiff < 0
                        ? tr(
                            lang,
                            `Спуститесь на лифте или лестнице на ${destLocation.floor}-й этаж к ${getRoomCode(destLocation)}.`,
                            `Take the central elevator or stairs down to Floor ${destLocation.floor} to ${getRoomCode(destLocation)}.`
                          )
                        : tr(
                            lang,
                            `Следуйте по центральному коридору ${destLocation.floor}-го этажа к ${getRoomCode(destLocation)} (~40 м).`,
                            `Walk directly along the Floor ${destLocation.floor} central corridor to ${getRoomCode(destLocation)} (~40 m).`
                          )}
                  </p>
                </div>
              </div>

              {floorDiff !== 0 && (
                <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedFloorOverride(originLocation.floor)}
                    className={`px-2.5 py-1 min-h-[44px] rounded-lg text-[11px] font-sans font-semibold transition-colors cursor-pointer border ${
                      selectedFloor === originLocation.floor
                        ? 'bg-[#161821] text-white border-[#161821]'
                        : 'bg-white dark:bg-[#121620] text-[#475569] dark:text-[#94a3b8] border-[#e2e4e8] dark:border-[#273142]'
                    }`}
                  >
                    {tr(
                      lang,
                      `Старт (${originLocation.floor} эт.)`,
                      `Start (${originLocation.floor}F)`
                    )}
                  </button>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <button
                    type="button"
                    onClick={() => setSelectedFloorOverride(destLocation.floor)}
                    className={`px-2.5 py-1 min-h-[44px] rounded-lg text-[11px] font-sans font-semibold transition-colors cursor-pointer border ${
                      selectedFloor === destLocation.floor
                        ? 'bg-[#161821] text-white border-[#161821]'
                        : 'bg-white dark:bg-[#121620] text-[#475569] dark:text-[#94a3b8] border-[#e2e4e8] dark:border-[#273142]'
                    }`}
                  >
                    {tr(lang, `Финиш (${destLocation.floor} эт.)`, `End (${destLocation.floor}F)`)}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. FLOOR SWITCHER & INTERACTIVE SVG FLOOR PLAN
              ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-sans text-[#475569] dark:text-[#94a3b8]">
              <Compass className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
              <span className="font-bold text-[#161821] dark:text-white uppercase tracking-wider">
                {lang === 'ru' ? `План: ${selectedFloor} этаж` : `Plan: Floor ${selectedFloor}`}
              </span>
              <span>•</span>
              <span>
                {selectedFloor === destLocation.floor
                  ? tr(lang, 'Этаж назначения', 'Arrival Floor')
                  : selectedFloor === originLocation.floor
                    ? tr(lang, 'Этаж отправления', 'Departure Floor')
                    : tr(lang, 'Транзитный этаж', 'Transit Floor')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Mobile Zoom Toggle for Crisp Panning on Small Phones */}
              <button
                type="button"
                onClick={() => setMobileZoom((z) => !z)}
                className="sm:hidden px-3 py-1 min-h-[44px] rounded-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] text-xs font-sans font-semibold text-[#161821] dark:text-white flex items-center space-x-1 cursor-pointer"
                aria-label={tr(lang, 'Масштаб схемы', 'Toggle map zoom')}
              >
                {mobileZoom ? (
                  <ZoomOut className="w-3.5 h-3.5" />
                ) : (
                  <ZoomIn className="w-3.5 h-3.5" />
                )}
                <span>{mobileZoom ? tr(lang, 'Вписать', 'Fit') : tr(lang, 'Крупно', 'Zoom')}</span>
              </button>

              {/* Floor Switcher Tabs */}
              <div className="flex items-center gap-1 bg-[#f6f6f9] dark:bg-[#121620] p-1 rounded-full border border-[#e2e4e8] dark:border-[#273142] shadow-xs">
                {[1, 2, 3].map((floor) => (
                  <button
                    type="button"
                    key={floor}
                    onClick={() => setSelectedFloorOverride(floor)}
                    className={`px-3 py-1 min-h-[44px] rounded-full text-xs font-heading font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                      selectedFloor === floor
                        ? 'bg-[#161821] text-white dark:bg-[#45d320] dark:text-[#161821] shadow-xs'
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
            </div>
          </div>

          {/* SVG Floor Plan Container (Supports Fit-to-Screen or Touch-Pan Zoom on Mobile) */}
          <div className="relative bg-[#f8fafc] dark:bg-[#0f121a] rounded-2xl sm:rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-2 sm:p-4 overflow-x-auto shadow-inner">
            <div
              className={`${
                mobileZoom ? 'min-w-[580px]' : 'w-full'
              } aspect-[800/420] select-none mx-auto`}
            >
              <svg
                viewBox="0 0 800 420"
                className="w-full h-full font-sans block"
                style={{ shapeRendering: 'geometricPrecision' }}
              >
                <defs>
                  <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-[#e2e4e8]/40 dark:text-[#273142]/40"
                    />
                  </pattern>
                  <linearGradient id="routeGradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#166534" />
                    <stop offset="100%" stopColor="#45d320" />
                  </linearGradient>
                </defs>

                <rect width="800" height="420" fill="url(#gridPattern)" />

                {/* Outer Wall Boundary */}
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

                {/* Central Horizontal Corridor */}
                <rect
                  x="50"
                  y="200"
                  width="700"
                  height="30"
                  fill="currentColor"
                  className="text-[#e2e4e8]/60 dark:text-[#171c26]/80"
                />

                {/* Vertical Central Hub */}
                <rect
                  x="370"
                  y="50"
                  width="60"
                  height="320"
                  fill="currentColor"
                  className="text-[#e2e4e8]/40 dark:text-[#171c26]/60"
                />

                {/* Central Elevator & Stairwell Hub */}
                <g transform="translate(375, 195)">
                  <rect
                    x="0"
                    y="0"
                    width="50"
                    height="40"
                    rx="8"
                    fill="#161821"
                    stroke={floorDiff !== 0 ? '#f59e0b' : '#33b712'}
                    strokeWidth={floorDiff !== 0 ? '2.5' : '1.5'}
                  />
                  <text
                    x="25"
                    y="17"
                    textAnchor="middle"
                    fill="#45d320"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="Inter, sans-serif"
                  >
                    {lang === 'ru' ? 'ЛИФТ' : 'LIFT'}
                  </text>
                  <text
                    x="25"
                    y="30"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8.5"
                    fontFamily="Inter, sans-serif"
                  >
                    {floorDiff > 0
                      ? lang === 'ru'
                        ? '▲ ВВЕРХ'
                        : '▲ UP'
                      : floorDiff < 0
                        ? lang === 'ru'
                          ? '▼ ВНИЗ'
                          : '▼ DOWN'
                        : lang === 'ru'
                          ? 'ХОЛЛ'
                          : 'HUB'}
                  </text>
                </g>

                {/* Turnstile Gateway Block (Visible on Floor 1) */}
                {selectedFloor === 1 && (
                  <g transform="translate(340, 310)">
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="55"
                      rx="8"
                      fill="#161821"
                      stroke="#33b712"
                      strokeWidth="2"
                    />
                    <text
                      x="60"
                      y="24"
                      textAnchor="middle"
                      fill="#45d320"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="Inter, sans-serif"
                    >
                      {lang === 'ru' ? 'ГЛАВНЫЙ ВХОД' : 'MAIN ENTRANCE'}
                    </text>
                    <text
                      x="60"
                      y="40"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8.5"
                      fontFamily="Inter, sans-serif"
                    >
                      {lang === 'ru' ? 'ТУРНИКЕТЫ СКУД' : 'TURNSTILES'}
                    </text>
                  </g>
                )}

                {/* Restrooms & Water Fountains */}
                <g transform="translate(330, 203)">
                  <rect x="0" y="0" width="30" height="24" rx="4" fill="#64748b" opacity="0.3" />
                  <text
                    x="15"
                    y="16"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    WC
                  </text>
                </g>
                <g transform="translate(440, 203)">
                  <rect x="0" y="0" width="30" height="24" rx="4" fill="#0284c7" opacity="0.2" />
                  <text
                    x="15"
                    y="16"
                    textAnchor="middle"
                    fill="#0284c7"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    H2O
                  </text>
                </g>

                {/* Render Classrooms on current floor */}
                {floorRooms.map((room) => {
                  const isDestination = destLocation.id === room.id;
                  const isOrigin = originLocation.id === room.id;
                  const displayCode = getRoomCode(room);
                  return (
                    <g
                      key={room.id}
                      onClick={() => {
                        setDestinationId(room.id);
                        setSelectedFloorOverride(null);
                      }}
                      className="cursor-pointer transition-all duration-200 group"
                      tabIndex={0}
                      role="button"
                      aria-label={`${displayCode}: ${lang === 'ru' ? room.nameRu : room.nameEn}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setDestinationId(room.id);
                          setSelectedFloorOverride(null);
                        }
                      }}
                    >
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.w}
                        height={room.h}
                        rx="12"
                        className={`transition-all duration-300 ${
                          isDestination
                            ? 'fill-[#be123c]/20 dark:fill-[#be123c]/30 stroke-[#be123c] stroke-[3px] filter drop-shadow-md'
                            : isOrigin
                              ? 'fill-[#33b712]/20 dark:fill-[#33b712]/30 stroke-[#33b712] stroke-[3px] filter drop-shadow-md'
                              : 'fill-white dark:fill-[#1e2533] stroke-[#cbd5e1] dark:stroke-[#334155] stroke-[1.5px] hover:stroke-[#33b712]/70 hover:fill-[#f1f5f9] dark:hover:fill-[#273142]'
                        }`}
                      />

                      <circle
                        cx={room.door.x}
                        cy={room.door.y}
                        r={isDestination || isOrigin ? 5.5 : 4}
                        className={
                          isDestination
                            ? 'fill-[#be123c] stroke-white stroke-2'
                            : isOrigin
                              ? 'fill-[#166534] dark:fill-[#45d320] stroke-white stroke-2'
                              : 'fill-[#94a3b8] dark:fill-[#475569]'
                        }
                      />

                      <text
                        x={room.x + 16}
                        y={room.y + 30}
                        fontSize="16"
                        fontWeight="bold"
                        className={`font-sans ${
                          isDestination
                            ? 'fill-[#be123c] dark:fill-[#fecdd3]'
                            : isOrigin
                              ? 'fill-[#166534] dark:fill-[#45d320]'
                              : 'fill-[#161821] dark:fill-white'
                        }`}
                      >
                        {displayCode}
                      </text>

                      <text
                        x={room.x + 16}
                        y={room.y + 52}
                        fontSize="11.5"
                        className="font-sans fill-[#475569] dark:fill-[#cbd5e1]"
                      >
                        {lang === 'ru'
                          ? room.nameRu.slice(0, 26) + (room.nameRu.length > 26 ? '…' : '')
                          : room.nameEn.slice(0, 26) + (room.nameEn.length > 26 ? '…' : '')}
                      </text>

                      <text
                        x={room.x + 16}
                        y={room.y + 74}
                        fontSize="11"
                        className="font-sans fill-[#64748b] dark:fill-[#94a3b8]"
                      >
                        {lang === 'ru'
                          ? `${room.capacity} мест • ${selectedFloor} эт.`
                          : `${room.capacity} seats • ${selectedFloor}F`}
                      </text>

                      {isDestination && (
                        <g transform={`translate(${room.x + room.w - 36}, ${room.y + 14})`}>
                          <circle
                            cx="12"
                            cy="12"
                            r="14"
                            fill="#be123c"
                            opacity="0.3"
                            className="animate-ping"
                          />
                          <circle cx="12" cy="12" r="10" fill="#be123c" />
                          <text
                            x="12"
                            y="15"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            B
                          </text>
                        </g>
                      )}

                      {isOrigin && !isDestination && (
                        <g transform={`translate(${room.x + room.w - 36}, ${room.y + 14})`}>
                          <circle
                            cx="12"
                            cy="12"
                            r="14"
                            fill="#33b712"
                            opacity="0.3"
                            className="animate-ping"
                          />
                          <circle cx="12" cy="12" r="10" fill="#166534" />
                          <text
                            x="12"
                            y="15"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            A
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Animated Route Path */}
                {routePathD && (
                  <path
                    d={routePathD}
                    fill="none"
                    stroke="url(#routeGradientLine)"
                    strokeWidth="4.5"
                    strokeDasharray="6,4"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3B. QUICK-TAP FLOOR ROOM SELECTOR CARDS (Ergonomic on Mobile Phones)
              ───────────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94a3b8]">
              {tr(
                lang,
                `Аудитории ${selectedFloor}-го этажа (нажмите для построения маршрута):`,
                `Floor ${selectedFloor} Rooms (tap to route):`
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {floorRooms.map((room) => {
                const isSelected = destLocation.id === room.id;
                return (
                  <button
                    type="button"
                    key={room.id}
                    onClick={() => {
                      setDestinationId(room.id);
                      setSelectedFloorOverride(null);
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                      isSelected
                        ? 'bg-[#be123c] text-white border-[#be123c] shadow-xs'
                        : 'bg-[#f6f6f9] dark:bg-[#121620] text-[#161821] dark:text-white border-[#e2e4e8] dark:border-[#273142] hover:border-[#33b712]'
                    }`}
                  >
                    <span className="font-heading font-bold text-xs truncate">
                      {getRoomCode(room)}
                    </span>
                    <span
                      className={`text-[10px] font-sans truncate ${
                        isSelected ? 'text-white/85' : 'text-[#475569] dark:text-[#94a3b8]'
                      }`}
                    >
                      {lang === 'ru' ? room.nameRu : room.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4. STEP-BY-STEP ITINERARY & EQUIPMENT
              ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Step-by-Step Route Checklist */}
            <div className="p-4 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-heading font-semibold text-[#161821] dark:text-white">
                <Footprints className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>{tr(lang, 'Маршрут шаг за шагом', 'Step-by-Step Itinerary')}</span>
              </div>
              <ol className="text-xs text-[#475569] dark:text-[#cbd5e1] space-y-2 font-sans">
                <li className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    {lang === 'ru' ? (
                      <>
                        <strong>{getRoomCode(originLocation)}</strong> ({originLocation.floor} эт.)
                        — старт движения.
                      </>
                    ) : (
                      <>
                        <strong>{getRoomCode(originLocation)}</strong> ({originLocation.floor}F) —
                        starting point.
                      </>
                    )}
                  </span>
                </li>

                {floorDiff !== 0 && (
                  <li className="flex items-start space-x-2">
                    <span
                      className={`w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 ${
                        floorDiff > 0 ? 'bg-[#d97706]' : 'bg-[#0284c7]'
                      }`}
                    >
                      2
                    </span>
                    <span>
                      {floorDiff > 0
                        ? tr(
                            lang,
                            `Подъем на ${floorDiff} этаж(а) на лифте или лестнице №1 в атриуме.`,
                            `Go up ${floorDiff} floor(s) via the central elevator or Stairwell #1.`
                          )
                        : tr(
                            lang,
                            `Спуск на ${Math.abs(floorDiff)} этаж(а) по лестнице или на лифте.`,
                            `Go down ${Math.abs(floorDiff)} floor(s) via stairs or elevator.`
                          )}
                    </span>
                  </li>
                )}

                <li className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#be123c] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    {floorDiff !== 0 ? 3 : 2}
                  </span>
                  <span>
                    {lang === 'ru' ? (
                      <>
                        Прибытие в <strong>{getRoomCode(destLocation)}</strong> (
                        {destLocation.floor} эт., {destLocation.wingRu}).
                      </>
                    ) : (
                      <>
                        Arrive at <strong>{getRoomCode(destLocation)}</strong> ({destLocation.floor}
                        F, {destLocation.wingEn}).
                      </>
                    )}
                  </span>
                </li>
              </ol>
            </div>

            {/* Destination Equipment */}
            <div className="p-4 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-2">
              <div className="flex items-center space-x-2 text-xs font-heading font-semibold text-[#161821] dark:text-white">
                <Monitor className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>{tr(lang, 'Оснащение аудитории', 'Room Facilities')}</span>
              </div>
              <ul className="text-xs text-[#475569] dark:text-[#cbd5e1] space-y-1 font-sans">
                {(lang === 'ru' ? destLocation.equipmentRu : destLocation.equipmentEn).map(
                  (eq, idx) => (
                    <li key={idx} className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534] dark:bg-[#45d320] flex-shrink-0" />
                      <span>{eq}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Travel Time & Direct Stats */}
            <div className="p-4 rounded-2xl bg-[#161821] text-white border border-[#33b712]/40 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-xs font-heading font-semibold text-[#45d320]">
                  <Clock className="w-4 h-4 text-[#45d320]" />
                  <span>{tr(lang, 'Расчетное время в пути', 'Estimated Transit Time')}</span>
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-sans font-bold text-white">
                    {floorDiff === 0
                      ? tr(lang, '~45 сек', '~45 sec')
                      : tr(
                          lang,
                          `~1 мин ${Math.abs(floorDiff) * 20} сек`,
                          `~1 min ${Math.abs(floorDiff) * 20} sec`
                        )}
                  </span>
                  <span className="text-xs text-[#45d320] font-sans">
                    {floorDiff === 0
                      ? tr(lang, 'пешком', 'walking')
                      : tr(lang, 'лифт / ступени', 'lift / stairs')}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 font-sans mt-1">
                  {lang === 'ru'
                    ? `Маршрут построен: ${getRoomCode(originLocation)} → ${getRoomCode(destLocation)}`
                    : `Route active: ${getRoomCode(originLocation)} → ${getRoomCode(destLocation)}`}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-sans text-[#45d320]">
                <span>
                  {getRoomCode(destLocation)} • {tr(lang, 'ДОСТУПНО', 'ACCESSIBLE')}
                </span>
                <span className="flex items-center space-x-1">
                  <Wind className="w-3 h-3" />
                  <span>{tr(lang, 'Климат', 'A/C')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. COMPACT FOOTER
            ───────────────────────────────────────────────────────────── */}
        <div className="px-4 py-2.5 sm:p-4 border-t border-[#e2e4e8] dark:border-[#273142] bg-[#f6f6f9] dark:bg-[#121620] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="hidden sm:flex text-[11px] text-[#475569] dark:text-[#94a3b8] font-sans items-center space-x-2">
            <Users className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <span>
              {tr(
                lang,
                'Навигатор кампуса синхронизирован с расписанием осеннего семестра 2026/2027 г.',
                'Campus wayfinding is synchronized with the Fall 2026/2027 timetable.'
              )}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] rounded-full btn-brand-primary text-xs font-heading font-semibold transition-all cursor-pointer shadow-md text-center"
          >
            {tr(lang, 'Вернуться к расписанию', 'Back to Timetable')}
          </button>
        </div>
      </div>
    </div>
  );
};
