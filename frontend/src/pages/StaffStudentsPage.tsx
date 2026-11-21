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
import { tr, getStudyFormLabel, localizeText } from '../utils/i18n';
import { resolveAvatarSrc } from '../utils/avatar';

interface StaffStudentsPageProps {
  onOpenAnnouncement?: (
    targetGroup?: string,
    targetStudentId?: string,
    targetStudentName?: string
  ) => void;
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
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'debts' | 'budget' | 'contract' | 'honors' | 'starosta'
  >('all');

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
    return students.filter((student) => {
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
  const budgetCount = students.filter((s) => s.studyForm === 'Бюджет').length;
  const contractCount = students.filter((s) => s.studyForm === 'Контракт').length;
  const withDebtsCount = students.filter((s) => s.debtCount > 0).length;
  const avgGpa =
    students.length > 0
      ? (students.reduce((acc, s) => acc + s.gpa, 0) / students.length).toFixed(2)
      : '4.35';

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. MASTHEAD BANNER (Academic Dean's Office Authority)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
          <UniversityEmblem size={220} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#667085] dark:text-[#94A3B8]">
              <span className="font-mono text-[#142D4E] dark:text-[#93C5FD] font-semibold">
                {tr(lang, 'Деканат Факультета МО', "Dean's Office — Faculty of IR")}
              </span>
              <span>•</span>
              <span>{tr(lang, 'Контингент обучающихся', 'Student Registry')}</span>
              <span>•</span>
              <span>{tr(lang, '2026/2027 учебный год', '2026/2027 Academic Year')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
              {lang === 'ru'
                ? 'Студенты и академические группы'
                : 'Academic Groups & Student Rosters'}
            </h1>

            <p className="text-xs sm:text-sm text-[#475467] dark:text-[#CBD5E1] font-sans max-w-2xl">
              {tr(
                lang,
                'Служебный реестр контингента факультета: академические группы, старосты, списки студентов, ведомости успеваемости, контроль задолженностей и личные дела обучающихся.',
                'Faculty administrative registry: academic groups, class presidents, student rosters, grade sheets, arrears monitoring, and student dossiers.'
              )}
            </p>
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start">
            {onOpenAnnouncement && (
              <button
                onClick={() =>
                  onOpenAnnouncement(selectedGroup !== 'all' ? selectedGroup : undefined)
                }
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/40 shadow-xs cursor-pointer transition-colors"
              >
                <Megaphone className="w-4 h-4 text-[#93C5FD]" />
                <span>
                  {selectedGroup !== 'all'
                    ? tr(lang, `Написать группе ${selectedGroup}`, `Message Group ${selectedGroup}`)
                    : tr(lang, 'Опубликовать приказ', 'Publish Directive')}
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
          className={`p-4 rounded-xl bg-white dark:bg-[#112238] border shadow-xs transition-all cursor-pointer space-y-1 ${
            selectedGroup === 'all'
              ? 'border-[#142D4E] dark:border-[#245A91] ring-1 ring-[#142D4E]/20'
              : 'border-[#DCE2EA] dark:border-[#1E395B] hover:border-[#142D4E]'
          }`}
        >
          <span className="text-[11px] font-sans text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider block">
            {tr(lang, 'Академические группы', 'Academic Groups')}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-bold text-[#142D4E] dark:text-[#93C5FD]">
              {groups.length}
            </span>
            <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{tr(lang, 'группы', 'groups')}</span>
          </div>
          <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
            {tr(lang, 'Бакалавриат & Магистратура', "Bachelor's & Master's")}
          </p>
        </div>

        {/* Card 2: Total Students */}
        <div
          onClick={() => {
            setSelectedGroup('all');
            setStatusFilter('all');
          }}
          className="p-4 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs cursor-pointer hover:border-[#142D4E] transition-all space-y-1"
        >
          <span className="text-[11px] font-sans text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider block">
            {tr(lang, 'Контингент студентов', 'Enrolled Students')}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-bold text-[#142D4E] dark:text-[#93C5FD]">
              {totalStudents}
            </span>
            <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{tr(lang, 'в реестре', 'registered')}</span>
          </div>
          <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
            {tr(
              lang,
              `${budgetCount} бюджет • ${contractCount} договор`,
              `${budgetCount} state-funded • ${contractCount} tuition`
            )}
          </p>
        </div>

        {/* Card 3: Debts */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'debts' ? 'all' : 'debts')}
          className={`p-4 rounded-xl bg-white dark:bg-[#112238] border shadow-xs transition-all cursor-pointer space-y-1 ${
            statusFilter === 'debts'
              ? 'border-rose-500 ring-1 ring-rose-500/20'
              : 'border-[#DCE2EA] dark:border-[#1E395B] hover:border-rose-400'
          }`}
        >
          <span className="text-[11px] font-sans text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider block">
            {tr(lang, 'С задолженностями', 'With Arrears')}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">
              {withDebtsCount}
            </span>
            <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{tr(lang, 'обучающихся', 'students')}</span>
          </div>
          <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
            {statusFilter === 'debts'
              ? tr(lang, '✓ Фильтр применен', '✓ Filter active')
              : tr(lang, 'Требуют ликвидации долгов', 'Require retake clearance')}
          </p>
        </div>

        {/* Card 4: Average GPA */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'honors' ? 'all' : 'honors')}
          className={`p-4 rounded-xl bg-white dark:bg-[#112238] border shadow-xs transition-all cursor-pointer space-y-1 ${
            statusFilter === 'honors'
              ? 'border-emerald-500 ring-1 ring-emerald-500/20'
              : 'border-[#DCE2EA] dark:border-[#1E395B] hover:border-emerald-400'
          }`}
        >
          <span className="text-[11px] font-sans text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider block">
            {tr(lang, 'Средний балл факультета', 'Faculty Mean GPA')}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {avgGpa}
            </span>
            <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{tr(lang, 'из 5.0', 'out of 5.0')}</span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
            {statusFilter === 'honors'
              ? tr(lang, '✓ Только отличники', '✓ Honors only')
              : tr(lang, 'Показатель успеваемости', 'Academic performance index')}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACADEMIC GROUPS SECTION (Grid of Group Cards)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-[#142D4E] dark:text-[#93C5FD]">
              {tr(lang, 'Академические группы факультета', 'Faculty Academic Groups')}
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] font-sans">
              {tr(
                lang,
                'Выберите группу для фильтрации списка студентов или отправки группового оповещения',
                'Select a group to filter the student roster or send a group announcement'
              )}
            </p>
          </div>

          {selectedGroup !== 'all' && (
            <button
              onClick={() => setSelectedGroup('all')}
              className="text-xs font-sans text-[#142D4E] dark:text-[#93C5FD] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>{tr(lang, 'Показать все группы', 'Show All Groups')}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groups.map((group) => {
            const isSelected = selectedGroup === group.code;
            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(isSelected ? 'all' : group.code)}
                className={`p-4 rounded-xl bg-white dark:bg-[#112238] border transition-all cursor-pointer shadow-xs relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#142D4E] dark:border-[#245A91] ring-2 ring-[#142D4E]/20 dark:ring-[#245A91]/20 bg-[#F8FAFC] dark:bg-[#14263E]'
                    : 'border-[#DCE2EA] dark:border-[#1E395B] hover:border-[#142D4E] dark:hover:border-[#245A91]/60'
                }`}
              >
                <div className="space-y-3">
                  {/* Group Code & Year Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#142D4E] dark:text-[#93C5FD] bg-[#142D4E]/10 dark:bg-[#245A91]/15 px-2.5 py-1 rounded-md">
                      {group.code}
                    </span>
                    <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-[#F8FAFC] dark:bg-[#111714] border border-[#DCE2EA] dark:border-[#1E395B] text-[#667085] dark:text-[#94A3B8]">
                      {tr(lang, `${group.courseNumber} курс`, `Year ${group.courseNumber}`)}
                    </span>
                  </div>

                  {/* Program */}
                  <div>
                    <h3 className="font-semibold text-xs text-[#0F1D30] dark:text-[#FFFFFF] leading-snug">
                      {localizeText(group.program, lang)}
                    </h3>
                    <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] font-sans mt-0.5">
                      {tr(lang, 'Куратор', 'Advisor')}: {group.curatorName}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="pt-2 border-t border-[#DCE2EA] dark:border-[#193150] grid grid-cols-2 gap-2 text-xs font-sans">
                    <div>
                      <span className="text-[10px] text-[#667085] dark:text-[#94A3B8] block">
                        {tr(lang, 'Студентов:', 'Students:')}
                      </span>
                      <span className="font-mono font-bold text-[#0F1D30] dark:text-[#FFFFFF]">
                        {tr(lang, `${group.studentsCount} чел.`, `${group.studentsCount} students`)}
                      </span>
                      <span className="text-[10px] text-[#667085] dark:text-[#94A3B8] block">
                        (
                        {tr(
                          lang,
                          `${group.budgetCount} бюдж. / ${group.contractCount} дог.`,
                          `${group.budgetCount} state / ${group.contractCount} tuition`
                        )}
                        )
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#667085] dark:text-[#94A3B8] block">
                        {tr(lang, 'Средний GPA:', 'Mean GPA:')}
                      </span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {group.averageGpa.toFixed(2)}
                      </span>
                      {group.debtCount > 0 ? (
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block">
                          {tr(
                            lang,
                            `${group.debtCount} с долгами`,
                            `${group.debtCount} with arrears`
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
                          {tr(lang, '0 долгов', '0 arrears')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Starosta Info */}
                  {group.starostaName && (
                    <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[11px] font-sans">
                      <div className="flex items-center space-x-1.5 text-[#142D4E] dark:text-[#93C5FD] font-semibold">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>
                          {tr(lang, 'Староста', 'Group Rep')}: {group.starostaName}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#667085] dark:text-[#94A3B8] font-mono mt-0.5">
                        {group.starostaPhone}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action footer */}
                <div className="mt-4 pt-3 border-t border-[#DCE2EA] dark:border-[#193150] flex items-center justify-between text-xs font-sans">
                  <span className="text-[11px] font-medium text-[#142D4E] dark:text-[#93C5FD] flex items-center space-x-1">
                    <span>
                      {isSelected
                        ? tr(lang, '✓ Выбрана', '✓ Selected')
                        : tr(lang, 'Открыть список', 'Open Roster')}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  {onOpenAnnouncement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAnnouncement(group.code);
                      }}
                      title={tr(
                        lang,
                        `Написать объявление группе ${group.code}`,
                        `Send announcement to group ${group.code}`
                      )}
                      className="p-1.5 rounded-md text-[#667085] dark:text-[#94A3B8] hover:text-[#142D4E] dark:hover:text-[#245A91] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45] transition-colors cursor-pointer"
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
      <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs overflow-hidden">
        {/* Section Header with Search & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-[#DCE2EA] dark:border-[#193150] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base text-[#142D4E] dark:text-[#93C5FD] flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>
                  {selectedGroup === 'all'
                    ? tr(
                        lang,
                        'Сводный список студентов факультета',
                        'Consolidated Faculty Student Roster'
                      )
                    : tr(
                        lang,
                        `Студенты группы ${selectedGroup}`,
                        `Group ${selectedGroup} Students`
                      )}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#111714] border border-[#DCE2EA] dark:border-[#1E395B] text-[#667085] dark:text-[#94A3B8]">
                  {tr(lang, `${filteredStudents.length} чел.`, `${filteredStudents.length} total`)}
                </span>
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8] font-sans">
                {tr(
                  lang,
                  'Нажмите на студента для просмотра полного личного дела, зачетки и поданных заявлений',
                  'Click a student to view their full dossier, grade book, and submitted requests'
                )}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#667085] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr(
                  lang,
                  'Поиск по ФИО, студбилету...',
                  'Search by name, student ID...'
                )}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans text-[#0F1D30] dark:text-[#FFFFFF] placeholder-[#667085] dark:placeholder-[#94A3B8] focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label={tr(lang, 'Очистить поиск', 'Clear search')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#667085] dark:text-[#94A3B8] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-sans">
            <span className="text-[#667085] dark:text-[#94A3B8] text-[11px] mr-1 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>{tr(lang, 'Фильтр:', 'Filter:')}</span>
            </span>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#142D4E] text-[#FFFFFF] font-medium'
                  : 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#667085] dark:text-[#94A3B8] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B]'
              }`}
            >
              {tr(lang, `Все (${students.length})`, `All (${students.length})`)}
            </button>

            <button
              onClick={() => setStatusFilter('debts')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'debts'
                  ? 'bg-rose-600 text-white font-medium'
                  : 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-rose-700 dark:text-rose-400 hover:bg-rose-50 border border-rose-200 dark:border-rose-900/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>
                {tr(
                  lang,
                  `С задолженностями (${withDebtsCount})`,
                  `With Arrears (${withDebtsCount})`
                )}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('honors')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'honors'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 border border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>{tr(lang, 'Отличники (GPA ≥ 4.7)', 'Honors (GPA ≥ 4.7)')}</span>
            </button>

            <button
              onClick={() => setStatusFilter('budget')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'budget'
                  ? 'bg-[#142D4E] text-[#FFFFFF] font-medium'
                  : 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#667085] dark:text-[#94A3B8] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B]'
              }`}
            >
              {tr(lang, `Бюджет (${budgetCount})`, `State-funded (${budgetCount})`)}
            </button>

            <button
              onClick={() => setStatusFilter('contract')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'contract'
                  ? 'bg-[#142D4E] text-[#FFFFFF] font-medium'
                  : 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#667085] dark:text-[#94A3B8] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B]'
              }`}
            >
              {tr(lang, `Договор (${contractCount})`, `Tuition (${contractCount})`)}
            </button>

            <button
              onClick={() => setStatusFilter('starosta')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'starosta'
                  ? 'bg-[#245A91] text-[#142D4E] font-bold'
                  : 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#667085] dark:text-[#94A3B8] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B]'
              }`}
            >
              {tr(lang, '★ Старосты', '★ Group Reps')}
            </button>
          </div>
        </div>

        {/* Students Table / List */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs font-sans text-[#667085] dark:text-[#94A3B8] space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-30" />
            <p>
              {tr(
                lang,
                'Студенты не найдены по заданным критериям фильтрации.',
                'No students found matching the selected filters.'
              )}
            </p>
            <button
              onClick={() => {
                setSelectedGroup('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-[#142D4E] dark:text-[#93C5FD] font-semibold hover:underline"
            >
              {tr(lang, 'Сбросить фильтры', 'Reset Filters')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#DCE2EA] dark:divide-[#193150]">
            {filteredStudents.map((student) => {
              const hasDebt = student.debtCount > 0;
              return (
                <div
                  key={student.id}
                  onClick={() => handleOpenDossier(student.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC] dark:hover:bg-[#14263E]/60 transition-colors cursor-pointer group"
                >
                  {/* Left: Avatar, Name, Group, Student ID */}
                  <div className="flex items-center space-x-3.5">
                    <div className="relative flex-shrink-0">
                      <img
                        src={resolveAvatarSrc(student.avatarUrl, student.fullName)}
                        alt={student.fullName}
                        className="w-11 h-11 rounded-lg object-cover border border-[#DCE2EA] dark:border-[#1E395B] group-hover:border-[#142D4E] transition-colors"
                      />
                      {student.isStarosta && (
                        <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#245A91] text-[#FFFFFF] flex items-center justify-center text-[9px] font-bold shadow-xs">
                          ★
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#0F1D30] dark:text-[#FFFFFF] group-hover:text-[#142D4E] dark:group-hover:text-[#245A91] transition-colors">
                          {student.fullName}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded-md font-mono text-[10px] font-bold bg-[#142D4E] text-[#FFFFFF]">
                          {student.group}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-sans font-medium ${
                            student.studyForm === 'Бюджет'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {getStudyFormLabel(student.studyForm, lang)}
                        </span>
                        {student.isStarosta && (
                          <span className="text-[10px] font-bold text-[#1D4876] dark:text-[#93C5FD]">
                            {tr(lang, '(Староста)', '(Group Rep)')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085] dark:text-[#94A3B8] font-sans">
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
                  <div className="flex items-center justify-between md:justify-end space-x-4 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#DCE2EA] dark:border-[#193150]">
                    {/* GPA & Debts Badge */}
                    <div className="text-left md:text-right space-y-0.5">
                      <div className="flex items-center md:justify-end space-x-1.5">
                        <span className="text-[11px] text-[#667085] dark:text-[#94A3B8] font-sans">GPA:</span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            student.gpa >= 4.5
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : student.gpa >= 3.8
                                ? 'text-blue-700 dark:text-blue-400'
                                : 'text-amber-800 dark:text-amber-400'
                          }`}
                        >
                          {student.gpa.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#667085] dark:text-[#94A3B8] font-mono">
                          ({student.averageScore}%)
                        </span>
                      </div>

                      {hasDebt ? (
                        <div className="flex items-center space-x-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            {tr(
                              lang,
                              `${student.debtCount} долг (${student.debtSubjects?.[0] || 'Статистика'})`,
                              `${student.debtCount} arrear (${localizeText(student.debtSubjects?.[0] || 'Статистика', 'en')})`
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-sans block">
                          {tr(lang, '✓ Нет задолженностей', '✓ No arrears')}
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
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#162A45] hover:bg-[#EDF2F7] dark:hover:bg-[#233029] text-[#142D4E] dark:text-[#93C5FD] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#245A91]" />
                        <span>{tr(lang, 'Личное дело', 'Student Dossier')}</span>
                      </button>

                      {onOpenAnnouncement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAnnouncement(undefined, student.id, student.fullName);
                          }}
                          title={tr(
                            lang,
                            `Отправить уведомление ${student.fullName}`,
                            `Send notification to ${student.fullName}`
                          )}
                          className="p-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#667085] dark:text-[#94A3B8] hover:text-[#142D4E] dark:hover:text-[#245A91] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B] transition-colors cursor-pointer"
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
