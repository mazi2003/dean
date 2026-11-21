import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  ArrowRight,
  Eye,
  FileBadge,
} from 'lucide-react';
import { StudentRequest, RequestType } from '../types';
import { api } from '../services/api';
import { tr, getRequestStatusLabel, localizeText } from '../utils/i18n';

interface RequestsPageProps {
  onPreviewCert: (req: StudentRequest) => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ onPreviewCert }) => {
  const { user, lang } = useAuth();
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Request Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [reqs, types] = await Promise.all([api.getRequests(), api.getRequestTypes()]);
      setRequests(reqs);
      setRequestTypes(types);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [reqs, types] = await Promise.all([api.getRequests(), api.getRequestTypes()]);
        if (!cancelled) {
          setRequests(reqs);
          setRequestTypes(types);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleCancelRequest = async (id: string) => {
    if (
      !confirm(
        tr(
          lang,
          'Вы уверены, что хотите отозвать это заявление?',
          'Are you sure you want to withdraw this request?'
        )
      )
    )
      return;
    try {
      await api.cancelRequest(id);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      alert(message || tr(lang, 'Ошибка отмены заявления', 'Failed to cancel request'));
    }
  };

  const handleOpenWizard = (type?: RequestType) => {
    setSelectedType(type || requestTypes[0] || null);
    setFormData({});
    setIsWizardOpen(true);
  };

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setSubmitting(true);
    try {
      await api.createRequest(selectedType.code, formData);
      setIsWizardOpen(false);
      setSelectedType(null);
      setFormData({});
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      alert(message || tr(lang, 'Ошибка отправки заявления', 'Failed to submit request'));
    } finally {
      setSubmitting(false);
    }
  };

  // Kanban Status Tokens with Colored Status Dots
  const statusConfig = {
    submitted: {
      label: getRequestStatusLabel('submitted', lang, 'student'),
      pillClass: 'bg-[#e8f4fd] dark:bg-[#1a2838] text-[#0369a1] dark:text-[#38bdf8] border-[#3598fe]/30',
      dotClass: 'bg-[#3598fe]',
      icon: Clock,
    },
    in_review: {
      label: getRequestStatusLabel('in_review', lang, 'student'),
      pillClass: 'bg-[#e8f4fd] dark:bg-[#1a2838] text-[#0369a1] dark:text-[#38bdf8] border-[#3598fe]/30',
      dotClass: 'bg-[#3598fe]',
      icon: Clock,
    },
    needs_info: {
      label: getRequestStatusLabel('needs_info', lang, 'student'),
      pillClass: 'bg-[#fff9e6] dark:bg-[#2c2210] text-[#b45309] dark:text-[#fde68a] border-[#ffeeba] dark:border-[#523e1b]',
      dotClass: 'bg-[#f4b400]',
      icon: AlertCircle,
    },
    ready: {
      label: getRequestStatusLabel('ready', lang, 'student'),
      pillClass: 'bg-[#ebfbee] dark:bg-[#1e2d24] text-[#166534] dark:text-[#45d320] border-[#33b712]/30',
      dotClass: 'bg-[#33b712]',
      icon: CheckCircle2,
    },
    rejected: {
      label: getRequestStatusLabel('rejected', lang, 'student'),
      pillClass: 'bg-[#fff2f5] dark:bg-[#38161f] text-[#be123c] dark:text-[#fecdd3] border-[#ff4d8b]/30',
      dotClass: 'bg-[#ff4d8b]',
      icon: XCircle,
    },
    cancelled: {
      label: getRequestStatusLabel('cancelled', lang, 'student'),
      pillClass: 'bg-[#f6f6f9] dark:bg-[#1f2937] text-[#475569] dark:text-[#94a3b8] border-[#e2e4e8] dark:border-[#374151]',
      dotClass: 'bg-[#8a8b90]',
      icon: XCircle,
    },
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
        <div className="h-96 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ORDER ACTION (Modern Campus Design System)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e4e8] dark:border-[#273142]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#166534] dark:text-[#45d320] font-semibold mb-1">
            <span>{tr(lang, 'Канцелярия деканата', "Dean's Registry")}</span>
            <span>•</span>
            <span>{tr(lang, 'Кабинет 312', 'Room 312')}</span>
            <span>•</span>
            <span>{tr(lang, 'Электронный заказ справок', 'Digital Certificate Ordering')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[#161821] dark:text-[#ffffff]">
            {lang === 'ru'
              ? 'Справки и официальные заявления'
              : 'Official Petitions & Certificates'}
          </h1>
          <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans mt-0.5">
            {tr(
              lang,
              'Заказ справок с электронными макетами документов и подача заявлений онлайн',
              "Order digital certificate previews and submit official petitions to the Dean's Office"
            )}
          </p>
        </div>

        <button
          onClick={() => handleOpenWizard()}
          className="px-5 py-2.5 min-h-[44px] rounded-full btn-brand-primary text-xs sm:text-sm font-heading font-semibold flex items-center space-x-2 self-start sm:self-center cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{lang === 'ru' ? 'Подать новое заявление' : 'Order Document'}</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CERTIFICATE CATALOG (Academic Category Cards)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {requestTypes.map((t, index) => {
          // Pastel accent backgrounds for category cards
          const pastelBgs = [
            'bg-[#e8f4fd] dark:bg-[#1a2838]',
            'bg-[#fbf0eb] dark:bg-[#2b1f1a]',
            'bg-[#f4ebfc] dark:bg-[#281b36]',
            'bg-[#ebfbee] dark:bg-[#1e2d24]',
          ];
          const bgClass = pastelBgs[index % pastelBgs.length];

          return (
            <div
              key={t.code}
              className={`p-5 rounded-3xl ${bgClass} border border-[#e2e4e8] dark:border-[#273142] shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-all space-y-3.5`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-2xl bg-white dark:bg-[#161821] border border-black/5 flex items-center justify-center shadow-2xs">
                    <FileBadge className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                  </div>
                  <span className="text-[10px] font-sans font-medium text-[#475569] dark:text-[#94a3b8] bg-white/80 dark:bg-black/30 px-2.5 py-0.5 rounded-full">
                    {tr(lang, `Срок: ${t.slaDays} дн.`, `SLA: ${t.slaDays}d`)}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff] leading-snug">
                  {localizeText(t.title, lang)}
                </h3>
                <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1] font-sans leading-relaxed">
                  {localizeText(t.description, lang)}
                </p>
              </div>

              <button
                onClick={() => handleOpenWizard(t)}
                className="w-full py-2.5 px-4 min-h-[44px] rounded-full bg-white dark:bg-[#161821] hover:bg-[#161821] hover:text-white dark:hover:bg-white dark:hover:text-[#161821] border border-[#e2e4e8] dark:border-[#273142] text-xs font-heading font-semibold text-[#161821] dark:text-[#ffffff] transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>{tr(lang, 'Заказать', 'Request')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MY PETITIONS REGISTRY (Digital Registry Kanban List)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] overflow-hidden shadow-xs">
        <div className="p-5 bg-[#f6f6f9] dark:bg-[#121620] border-b border-[#e2e4e8] dark:border-[#273142] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <h3 className="font-heading font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#161821] dark:text-[#ffffff]">
              {tr(
                lang,
                `Журнал поданных заявлений (${requests.length})`,
                `Submitted Petitions (${requests.length})`
              )}
            </h3>
          </div>
          <span className="text-[11px] font-sans text-[#475569] dark:text-[#94a3b8]">
            {tr(lang, 'Архив с 2026 г.', 'Archive since 2026')}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#475569] dark:text-[#94a3b8] space-y-2">
            <FileText className="w-8 h-8 text-[#475569] dark:text-[#94a3b8] mx-auto opacity-50" />
            <p className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff]">
              {tr(lang, 'У вас пока нет активных заявлений', 'You have no active petitions yet')}
            </p>
            <p>
              {tr(
                lang,
                'Выберите нужный документ из каталога выше, чтобы оформить заявку.',
                'Select a document type from the catalog above to submit a request.'
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e2e4e8] dark:divide-[#273142]">
            {requests.map((req) => {
              const cfg = statusConfig[req.status] || statusConfig.submitted;
              const isExpanded = expandedId === req.id;
              const isReady = req.status === 'ready';

              return (
                <div
                  key={req.id}
                  className="p-5 hover:bg-[#f6f6f9]/50 dark:hover:bg-[#121620]/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans text-xs text-[#475569] dark:text-[#94a3b8]">№ {req.id}</span>
                        <h4 className="font-heading font-semibold text-sm sm:text-base text-[#161821] dark:text-[#ffffff]">
                          {localizeText(req.typeTitle, lang)}
                        </h4>
                      </div>
                      <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans">
                        {tr(lang, 'Подано:', 'Submitted:')}{' '}
                        <span className="font-sans">{req.createdAt}</span> •{' '}
                        {tr(lang, 'Срок исполнения: до', 'Expected by:')}{' '}
                        <span className="font-sans font-medium">{req.expectedDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      {/* Status indicator pill */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-heading font-semibold border flex items-center space-x-2 ${cfg.pillClass}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                        <span>{cfg.label}</span>
                      </span>

                      {isReady && (
                        <button
                          onClick={() => onPreviewCert(req)}
                          className="px-4 py-2 min-h-[44px] rounded-full bg-[#161821] dark:bg-white text-white dark:text-[#161821] text-xs font-heading font-bold flex items-center space-x-1.5 shadow-xs hover:bg-[#262a38] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
                          <span>{tr(lang, 'Макет PDF', 'Preview PDF')}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#475569] dark:text-[#94a3b8] hover:text-[#161821] dark:hover:text-white hover:bg-[#f6f6f9] dark:hover:bg-[#121620] transition-colors cursor-pointer"
                        aria-label={tr(lang, 'Подробнее', 'Details')}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Request Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#e2e4e8] dark:border-[#273142] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans animate-fade-in">
                      <div className="space-y-2 bg-[#f6f6f9] dark:bg-[#121620] p-4 rounded-2xl border border-[#e2e4e8] dark:border-[#273142]">
                        <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff] block">
                          {tr(lang, 'Параметры заявления:', 'Request Parameters:')}
                        </span>
                        {req.data && Object.keys(req.data).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(req.data).map(([k, v]) => (
                              <p key={k} className="text-[#4b5563] dark:text-[#cbd5e1]">
                                <span className="font-medium text-[#475569] dark:text-[#94a3b8]">{k}:</span> {String(v)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#475569] dark:text-[#94a3b8] italic">
                            {tr(lang, 'Стандартная форма запроса', 'Standard request form')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 bg-[#f6f6f9] dark:bg-[#121620] p-4 rounded-2xl border border-[#e2e4e8] dark:border-[#273142] flex flex-col justify-between">
                        <div>
                          <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff] block">
                            {tr(lang, 'Служебные отметки инспектора:', "Inspector's Remarks:")}
                          </span>
                          <p className="text-[#4b5563] dark:text-[#cbd5e1] mt-1 leading-relaxed">
                            {localizeText(req.history?.[req.history.length - 1]?.comment, lang) ||
                              tr(
                                lang,
                                'Заявление принято в работу канцелярией. Проводится верификация данных.',
                                'Petition accepted by the Registry. Data verification in progress.'
                              )}
                          </p>
                        </div>

                        {(req.status === 'submitted' || req.status === 'in_review') && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="text-xs text-[#be123c] dark:text-[#fecdd3] hover:underline self-start pt-2 cursor-pointer font-medium"
                          >
                            {tr(lang, 'Отозвать заявление', 'Withdraw Request')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. ORDER WIZARD MODAL (Modern Rounded Dialog)
          ───────────────────────────────────────────────────────────── */}
      {isWizardOpen && selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={localizeText(selectedType.title, lang)}
            className="relative w-full max-w-lg bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] shadow-2xl p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-5 h-5 text-[#166534] dark:text-[#45d320]" />
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#161821] dark:text-[#ffffff]">
                  {localizeText(selectedType.title, lang)}
                </h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-[#f6f6f9] dark:bg-[#121620] flex items-center justify-center text-[#475569] dark:text-[#94a3b8] hover:text-[#161821] dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans">
              {localizeText(selectedType.description, lang)} •{' '}
              {tr(
                lang,
                `Срок оформления: ${selectedType.slaDays} рабочих дней`,
                `Processing SLA: ${selectedType.slaDays} business days`
              )}
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs font-sans">
              {selectedType.fields?.map((f) => (
                <div key={f.name}>
                  <label className="block font-heading font-semibold text-[#161821] dark:text-[#ffffff] mb-1">
                    {f.label} {f.required && <span className="text-[#be123c] dark:text-[#fecdd3]">*</span>}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      required={f.required}
                      aria-label={f.label || f.name}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-full px-4 py-2.5 text-[#161821] dark:text-[#ffffff] focus:ring-2 focus:ring-[#33b712] focus:outline-none"
                    >
                      <option value="">
                        {tr(lang, '— Выберите вариант —', '— Select an option —')}
                      </option>
                      {f.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : f.type === 'number' ? (
                    <input
                      type="number"
                      required={f.required}
                      min={1}
                      max={10}
                      defaultValue={1}
                      placeholder={f.placeholder}
                      onChange={(e) => handleFieldChange(f.name, Number(e.target.value))}
                      className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-full px-4 py-2.5 text-[#161821] dark:text-[#ffffff] focus:ring-2 focus:ring-[#33b712] focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      required={f.required}
                      placeholder={f.placeholder}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-full px-4 py-2.5 text-[#161821] dark:text-[#ffffff] focus:ring-2 focus:ring-[#33b712] focus:outline-none"
                    />
                  )}
                </div>
              ))}

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-[#e2e4e8] dark:border-[#273142] text-[#475569] dark:text-[#94a3b8] hover:text-[#161821] dark:hover:text-white transition-colors cursor-pointer font-heading"
                >
                  {tr(lang, 'Отмена', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full btn-brand-primary text-white font-heading font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? tr(lang, 'Отправка...', 'Submitting...')
                      : tr(lang, 'Отправить в деканат', "Submit to Dean's Office")}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
