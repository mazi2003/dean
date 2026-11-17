import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  AlertTriangle,
  Award,
  ChevronRight,
  Send,
  FileText,
  Megaphone,
  UserCheck,
  X,
} from 'lucide-react';
import { AcademicGroup, StudentListItem, StudentDossier } from '../types';
import { api } from '../services/api';
import { StudentDossierModal } from '../components/StudentDossierModal';
import { UniversityEmblem } from '../components/UniversityEmblem';
import { useAuth } from '../context/AuthContext';

interface StaffStudentsPageProps {
  onOpenAnnouncement?: (targetGroup?: string, targetStudentId?: string, targetStudentName?: string) => void;
  initialSelectedGroup?: string;
  initialStudentId?: string;
}

export const StaffStudentsPage: React.FC<StaffStudentsPageProps> = ({
  onOpenAnnouncement,
  initialSelectedGroup = 'all',
  initialStudentId,
}) => {
  const { lang } = useAuth();

  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedGroup, setSelectedGroup] = useState<string>(initialSelectedGroup);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debts' | 'budget' | 'contract' | 'honors' | 'starosta'>('all');

  // Dossier state
  const [selectedDossier, setSelectedDossier] = useState<StudentDossier | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const handleOpenDossier = useCallback(async (studentId: string) => {
    try {
      const dossier = await api.getStudentDossier(studentId);
      if (dossier) {
        setSelectedDossier(dossier);
        setIsDossierOpen(true);
      }
    } catch (err) {
      console.error('Error loading dossier:', err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [grpData, stuData] = await Promise.all([
          api.getStaffGroups(),
          api.getGroupStudents('all'),
        ]);
        setGroups(grpData);
        setStudents(stuData);

        if (initialStudentId) {
          handleOpenDossier(initialStudentId);
        }
      } catch (err) {
        console.error('Error fetching groups/students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialStudentId, handleOpenDossier]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Group filter
      if (selectedGroup !== 'all' && student.group !== selectedGroup) {
        return false;
      }

      // Status filter
      if (statusFilter === 'debts' && student.debtCount === 0) return false;
      if (statusFilter === 'budget' && student.studyForm !== 'Бюджет') return false;
      if (statusFilter === 'contract' && student.studyForm !== 'Контракт') return false;
      if (statusFilter === 'honors' && student.gpa < 4.7) return false;
      if (statusFilter === 'starosta' && !student.isStarosta) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = student.fullName.toLowerCase().includes(q);
        const matchesNum = student.studentNumber.toLowerCase().includes(q);
        const matchesEmail = student.email.toLowerCase().includes(q);
        const matchesGroup = student.group.toLowerCase().includes(q);
        if (!matchesName && !matchesNum && !matchesEmail && !matchesGroup) return false;
      }

      return true;
    });
  }, [students, selectedGroup, statusFilter, searchQuery]);

  // Aggregate stats
  const totalStudents = students.length;
  const budgetCount = students.filter(s => s.studyForm === 'Бюджет').length;
  const contractCount = students.filter(s => s.studyForm === 'Контракт').length;
  const withDebtsCount = students.filter(s => s.debtCount > 0).length;
  const avgGpa = students.length > 0
    ? (students.reduce((acc, s) => acc + s.gpa, 0) / students.length).toFixed(2)
    : '4.35';

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. MASTHEAD BANNER (Academic Dean's Office Authority)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
          <UniversityEmblem size={220} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#7E877B] dark:text-[#8E9B93]">
              <span className="font-mono text-[#183D35] dark:text-[#C4A46B] font-semibold">
                Деканат Факультета МО
              </span>
              <span>•</span>
              <span>Контингент обучающихся</span>
              <span>•</span>
              <span>2026/2027 учебный год</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
              {lang === 'ru' ? 'Студенты и академические группы' : 'Academic Groups & Student Rosters'}
            </h1>

            <p className="text-xs sm:text-sm text-[#575F53] dark:text-[#C8D1CA] font-sans max-w-2xl">
              Служебный реестр контингента факультета: академические группы, старосты, списки студентов, ведомости успеваемости, контроль задолженностей и личные дела обучающихся.
            </p>
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start">
            {onOpenAnnouncement && (
              <button
                onClick={() => onOpenAnnouncement(selectedGroup !== 'all' ? selectedGroup : undefined)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] text-xs font-sans font-semibold border border-[#C4A46B]/40 shadow-xs cursor-pointer transition-colors"
              >
                <Megaphone className="w-4 h-4 text-[#C4A46B]" />
                <span>
                  {selectedGroup !== 'all'
                    ? `Написать группе ${selectedGroup}`
                    : 'Опубликовать приказ'}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. KPI SUMMARY METRIC CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Groups */}
        <div
          onClick={() => setSelectedGroup('all')}
          className={`p-4 rounded-xl bg-white dark:bg-[#18221D] border shadow-xs transition-all cursor-pointer space-y-1 ${
            selectedGroup === 'all'
              ? 'border-[#183D35] dark:border-[#C4A46B] ring-1 ring-[#183D35]/20'
              : 'border-[#E3DDD1] dark:border-[#2D3E35] hover:border-[#183D35]'
          }`}
        >
          <span className="text-[11px] font-sans text-[#7E877B] uppercase tracking-wider block">
            Академические группы
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-bold text-[#183D35] dark:text-[#C4A46B]">
              {groups.length}
            </span>
            <span className="text-xs text-[#7E877B]">группы</span>
          </div>
          <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA]">
            Бакалавриат & Магистратура
          </p>
        </div>

        {/* Card 2: Total Students */}
        <div
          onClick={() => {
            setSelectedGroup('all');
            setStatusFilter('all');
          }}
          className="p-4 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs cursor-pointer hover:border-[#183D35] transition-all space-y-1"
        >
          <span className="text-[11px] font-sans text-[#7E877B] uppercase tracking-wider block">
            Контингент студентов
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-bold text-[#183D35] dark:text-[#C4A46B]">
              {totalStudents}
            </span>
            <span className="text-xs text-[#7E877B]">в реестре</span>
          </div>
          <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA]">
            {budgetCount} бюджет • {contractCount} договор
          </p>
        </div>

        {/* Card 3: Debts */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'debts' ? 'all' : 'debts')}
          className={`p-4 rounded-xl bg-white dark:bg-[#18221D] border shadow-xs transition-all cursor-pointer space-y-1 ${
            statusFilter === 'debts'
              ? 'border-rose-500 ring-1 ring-rose-500/20'
              : 'border-[#E3DDD1] dark:border-[#2D3E35] hover:border-rose-400'
          }`}
        >
          <span className="text-[11px] font-sans text-[#7E877B] uppercase tracking-wider block">
            С задолженностями
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">
              {withDebtsCount}
            </span>
            <span className="text-xs text-[#7E877B]">обучающихся</span>
          </div>
          <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
            {statusFilter === 'debts' ? '✓ Фильтр применен' : 'Требуют ликвидации долгов'}
          </p>
        </div>

        {/* Card 4: Average GPA */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'honors' ? 'all' : 'honors')}
          className={`p-4 rounded-xl bg-white dark:bg-[#18221D] border shadow-xs transition-all cursor-pointer space-y-1 ${
            statusFilter === 'honors'
              ? 'border-emerald-500 ring-1 ring-emerald-500/20'
              : 'border-[#E3DDD1] dark:border-[#2D3E35] hover:border-emerald-400'
          }`}
        >
          <span className="text-[11px] font-sans text-[#7E877B] uppercase tracking-wider block">
            Средний балл факультета
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {avgGpa}
            </span>
            <span className="text-xs text-[#7E877B]">из 5.0</span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
            {statusFilter === 'honors' ? '✓ Только отличники' : 'Показатель успеваемости'}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACADEMIC GROUPS SECTION (Grid of Group Cards)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#183D35] dark:text-[#C4A46B]">
              Академические группы факультета
            </h2>
            <p className="text-xs text-[#7E877B] font-sans">
              Выберите группу для фильтрации списка студентов или отправки группового оповещения
            </p>
          </div>

          {selectedGroup !== 'all' && (
            <button
              onClick={() => setSelectedGroup('all')}
              className="text-xs font-sans text-[#183D35] dark:text-[#C4A46B] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Показать все группы</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groups.map(group => {
            const isSelected = selectedGroup === group.code;
            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(isSelected ? 'all' : group.code)}
                className={`p-4 rounded-xl bg-white dark:bg-[#18221D] border transition-all cursor-pointer shadow-xs relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#183D35] dark:border-[#C4A46B] ring-2 ring-[#183D35]/20 dark:ring-[#C4A46B]/20 bg-[#FAF8F3] dark:bg-[#1C2822]'
                    : 'border-[#E3DDD1] dark:border-[#2D3E35] hover:border-[#183D35] dark:hover:border-[#C4A46B]/60'
                }`}
              >
                <div className="space-y-3">
                  {/* Group Code & Year Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#183D35] dark:text-[#C4A46B] bg-[#183D35]/10 dark:bg-[#C4A46B]/15 px-2.5 py-1 rounded-md">
                      {group.code}
                    </span>
                    <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-[#FAF8F3] dark:bg-[#111714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#7E877B]">
                      {group.courseNumber} курс
                    </span>
                  </div>

                  {/* Program */}
                  <div>
                    <h3 className="font-serif font-bold text-xs text-[#252923] dark:text-[#F3EFE5] leading-snug">
                      {group.program}
                    </h3>
                    <p className="text-[11px] text-[#7E877B] font-sans mt-0.5">
                      Куратор: {group.curatorName}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="pt-2 border-t border-[#E3DDD1] dark:border-[#26362F] grid grid-cols-2 gap-2 text-xs font-sans">
                    <div>
                      <span className="text-[10px] text-[#7E877B] block">Студентов:</span>
                      <span className="font-mono font-bold text-[#252923] dark:text-[#F3EFE5]">
                        {group.studentsCount} чел.
                      </span>
                      <span className="text-[10px] text-[#7E877B] block">
                        ({group.budgetCount} бюдж. / {group.contractCount} дог.)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7E877B] block">Средний GPA:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {group.averageGpa.toFixed(2)}
                      </span>
                      {group.debtCount > 0 ? (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                          {group.debtCount} с долгами
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                          0 долгов
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Starosta Info */}
                  {group.starostaName && (
                    <div className="p-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[11px] font-sans">
                      <div className="flex items-center space-x-1.5 text-[#183D35] dark:text-[#C4A46B] font-semibold">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Староста: {group.starostaName}</span>
                      </div>
                      <div className="text-[10px] text-[#7E877B] font-mono mt-0.5">
                        {group.starostaPhone}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action footer */}
                <div className="mt-4 pt-3 border-t border-[#E3DDD1] dark:border-[#26362F] flex items-center justify-between text-xs font-sans">
                  <span className="text-[11px] font-medium text-[#183D35] dark:text-[#C4A46B] flex items-center space-x-1">
                    <span>{isSelected ? '✓ Выбрана' : 'Открыть список'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  {onOpenAnnouncement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAnnouncement(group.code);
                      }}
                      title={`Написать объявление группе ${group.code}`}
                      className="p-1.5 rounded-md text-[#7E877B] hover:text-[#183D35] dark:hover:text-[#C4A46B] hover:bg-[#EAE4D7] dark:hover:bg-[#1A2520] transition-colors cursor-pointer"
                    >
                      <Megaphone className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. STUDENTS ROSTER SECTION (Search, Filters, Table/Cards)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs overflow-hidden">
        {/* Section Header with Search & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-[#E3DDD1] dark:border-[#26362F] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#183D35] dark:text-[#C4A46B] flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>
                  {selectedGroup === 'all'
                    ? 'Сводный список студентов факультета'
                    : `Студенты группы ${selectedGroup}`}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F3] dark:bg-[#111714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#7E877B]">
                  {filteredStudents.length} чел.
                </span>
              </h3>
              <p className="text-xs text-[#7E877B] font-sans">
                Нажмите на студента для просмотра полного личного дела, зачетки и поданных заявлений
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#7E877B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по ФИО, студбилету..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans text-[#252923] dark:text-[#F3EFE5] placeholder-[#7E877B] focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E877B] hover:text-[#252923]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-sans">
            <span className="text-[#7E877B] text-[11px] mr-1 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Фильтр:</span>
            </span>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#183D35] text-[#F3EFE5] font-medium'
                  : 'bg-[#FAF8F3] dark:bg-[#121714] text-[#7E877B] hover:text-[#252923] border border-[#E3DDD1] dark:border-[#2D3E35]'
              }`}
            >
              Все ({students.length})
            </button>

            <button
              onClick={() => setStatusFilter('debts')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'debts'
                  ? 'bg-rose-600 text-white font-medium'
                  : 'bg-[#FAF8F3] dark:bg-[#121714] text-rose-700 dark:text-rose-400 hover:bg-rose-50 border border-rose-200 dark:border-rose-900/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>С задолженностями ({withDebtsCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('honors')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'honors'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-[#FAF8F3] dark:bg-[#121714] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 border border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>Отличники (GPA ≥ 4.7)</span>
            </button>

            <button
              onClick={() => setStatusFilter('budget')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'budget'
                  ? 'bg-[#183D35] text-[#F3EFE5] font-medium'
                  : 'bg-[#FAF8F3] dark:bg-[#121714] text-[#7E877B] hover:text-[#252923] border border-[#E3DDD1] dark:border-[#2D3E35]'
              }`}
            >
              Бюджет ({budgetCount})
            </button>

            <button
              onClick={() => setStatusFilter('contract')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'contract'
                  ? 'bg-[#183D35] text-[#F3EFE5] font-medium'
                  : 'bg-[#FAF8F3] dark:bg-[#121714] text-[#7E877B] hover:text-[#252923] border border-[#E3DDD1] dark:border-[#2D3E35]'
              }`}
            >
              Договор ({contractCount})
            </button>

            <button
              onClick={() => setStatusFilter('starosta')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'starosta'
                  ? 'bg-[#C4A46B] text-[#183D35] font-bold'
                  : 'bg-[#FAF8F3] dark:bg-[#121714] text-[#7E877B] hover:text-[#252923] border border-[#E3DDD1] dark:border-[#2D3E35]'
              }`}
            >
              ★ Старосты
            </button>
          </div>
        </div>

        {/* Students Table / List */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs font-sans text-[#7E877B] space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-30" />
            <p>Студенты не найдены по заданным критериям фильтрации.</p>
            <button
              onClick={() => {
                setSelectedGroup('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-[#183D35] dark:text-[#C4A46B] font-semibold hover:underline"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E3DDD1] dark:divide-[#26362F]">
            {filteredStudents.map(student => {
              const hasDebt = student.debtCount > 0;
              return (
                <div
                  key={student.id}
                  onClick={() => handleOpenDossier(student.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF8F3] dark:hover:bg-[#1C2822]/60 transition-colors cursor-pointer group"
                >
                  {/* Left: Avatar, Name, Group, Student ID */}
                  <div className="flex items-center space-x-3.5">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          student.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                        }
                        alt={student.fullName}
                        className="w-11 h-11 rounded-lg object-cover border border-[#E3DDD1] dark:border-[#2D3E35] group-hover:border-[#183D35] transition-colors"
                      />
                      {student.isStarosta && (
                        <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#C4A46B] text-[#183D35] flex items-center justify-center text-[9px] font-bold shadow-xs">
                          ★
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#252923] dark:text-[#F3EFE5] group-hover:text-[#183D35] dark:group-hover:text-[#C4A46B] transition-colors">
                          {student.fullName}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded-md font-mono text-[10px] font-bold bg-[#183D35] text-[#C4A46B]">
                          {student.group}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-sans font-medium ${
                            student.studyForm === 'Бюджет'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {student.studyForm}
                        </span>
                        {student.isStarosta && (
                          <span className="text-[10px] font-bold text-[#8C6D37] dark:text-[#C4A46B]">
                            (Староста)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#7E877B] font-sans">
                        <span className="font-mono text-[11px]">{student.studentNumber}</span>
                        <span>•</span>
                        <span>{student.email}</span>
                        {student.phone && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px]">{student.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Standing Metrics & Actions */}
                  <div className="flex items-center justify-between md:justify-end space-x-4 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#E3DDD1] dark:border-[#26362F]">
                    {/* GPA & Debts Badge */}
                    <div className="text-left md:text-right space-y-0.5">
                      <div className="flex items-center md:justify-end space-x-1.5">
                        <span className="text-[11px] text-[#7E877B] font-sans">GPA:</span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            student.gpa >= 4.5
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : student.gpa >= 3.8
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {student.gpa.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#7E877B] font-mono">
                          ({student.averageScore}%)
                        </span>
                      </div>

                      {hasDebt ? (
                        <div className="flex items-center space-x-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{student.debtCount} долг ({student.debtSubjects?.[0] || 'Статистика'})</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans block">
                          ✓ Нет задолженностей
                        </span>
                      )}
                    </div>

                    {/* Quick Button: Open Dossier */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDossier(student.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1A2520] hover:bg-[#EAE4D7] dark:hover:bg-[#233029] text-[#183D35] dark:text-[#C4A46B] border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C4A46B]" />
                        <span>Личное дело</span>
                      </button>

                      {onOpenAnnouncement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAnnouncement(undefined, student.id, student.fullName);
                          }}
                          title={`Отправить уведомление ${student.fullName}`}
                          className="p-1.5 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] text-[#7E877B] hover:text-[#183D35] dark:hover:text-[#C4A46B] hover:bg-[#EAE4D7] dark:hover:bg-[#1A2520] border border-[#E3DDD1] dark:border-[#2D3E35] transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. MODALS INTEGRATION
          ───────────────────────────────────────────────────────────── */}
      <StudentDossierModal
        isOpen={isDossierOpen}
        dossier={selectedDossier}
        onClose={() => setIsDossierOpen(false)}
        onSendMessage={(name, id, group) => {
          if (onOpenAnnouncement) {
            onOpenAnnouncement(group, id, name);
          }
        }}
      />
    </div>
  );
};
