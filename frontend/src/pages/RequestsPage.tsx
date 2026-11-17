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
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [reqs, types] = await Promise.all([
        api.getRequests(),
        api.getRequestTypes(),
      ]);
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
        const [reqs, types] = await Promise.all([
          api.getRequests(),
          api.getRequestTypes(),
        ]);
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
    } catch (err: any) {
      alert(err.message || tr(lang, 'Ошибка отмены заявления', 'Failed to cancel request'));
    }
  };

  const handleOpenWizard = (type?: RequestType) => {
    setSelectedType(type || requestTypes[0] || null);
    setFormData({});
    setIsWizardOpen(true);
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
    } catch (err: any) {
      alert(err.message || tr(lang, 'Ошибка отправки заявления', 'Failed to submit request'));
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    submitted: {
      label: getRequestStatusLabel('submitted', lang, 'student'),
      color: 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#142D4E] dark:text-[#245A91] border-[#DCE2EA] dark:border-[#1E395B]',
      icon: Clock,
    },
    in_review: {
      label: getRequestStatusLabel('in_review', lang, 'student'),
      color: 'bg-[#245A91]/15 text-[#142D4E] dark:text-[#245A91] border-[#245A91]/30',
      icon: Clock,
    },
    needs_info: {
      label: getRequestStatusLabel('needs_info', lang, 'student'),
      color: 'bg-[#C63740]/10 text-[#C63740] dark:text-[#F06A73] border-[#C63740]/30',
      icon: AlertCircle,
    },
    ready: {
      label: getRequestStatusLabel('ready', lang, 'student'),
      color: 'bg-[#142D4E] text-[#FFFFFF] border-[#245A91]/40',
      icon: CheckCircle2,
    },
    rejected: {
      label: getRequestStatusLabel('rejected', lang, 'student'),
      color: 'bg-[#C63740]/15 text-[#C63740] dark:text-[#F06A73] border-[#C63740]/30',
      icon: XCircle,
    },
    cancelled: {
      label: getRequestStatusLabel('cancelled', lang, 'student'),
      color: 'bg-[#667085]/10 text-[#667085] border-[#667085]/30',
      icon: XCircle,
    },
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
        <div className="h-96 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ORDER ACTION
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DCE2EA] dark:border-[#193150]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#142D4E] dark:text-[#245A91] font-semibold mb-1">
            <span>{tr(lang, 'Канцелярия деканата', "Dean's Registry")}</span>
            <span>•</span>
            <span>{tr(lang, 'Кабинет 312', 'Room 312')}</span>
            <span>•</span>
            <span>{tr(lang, 'ЭЦП ГОСТ Р 34.10-2012', 'GOST Digital Seal')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
            {lang === 'ru' ? 'Справки и официальные заявления' : 'Official Petitions & Certificates'}
          </h1>
          <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans mt-0.5">
            {tr(
              lang,
              'Заказ справок с усиленной квалифицированной электронной подписью деканата и подача заявлений',
              "Order digitally signed certificates and submit official petitions to the Dean's Office"
            )}
          </p>
        </div>

        <button
          onClick={() => handleOpenWizard()}
          className="px-4 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] font-sans font-semibold text-xs sm:text-sm border border-[#245A91]/40 hover:border-[#245A91] transition-all flex items-center space-x-2 self-start sm:self-center shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#245A91]" />
          <span>{lang === 'ru' ? 'Подать новое заявление' : 'Order Document'}</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CERTIFICATE CATALOG (Prestige Registry Grid)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {requestTypes.map(t => (
          <div
            key={t.code}
            className="p-4 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs flex flex-col justify-between hover:border-[#142D4E] dark:hover:border-[#245A91]/60 transition-all space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] flex items-center justify-center">
                  <FileBadge className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
                </div>
                <span className="text-[10px] font-mono text-[#667085]">
                  {tr(lang, `Срок: ${t.slaDays} дн.`, `SLA: ${t.slaDays}d`)}
                </span>
              </div>
              <h3 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF] leading-snug">
                {localizeText(t.title, lang)}
              </h3>
              <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1] font-sans leading-relaxed">
                {localizeText(t.description, lang)}
              </p>
            </div>

            <button
              onClick={() => handleOpenWizard(t)}
              className="w-full py-1.5 px-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#142D4E] hover:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium text-[#142D4E] dark:text-[#245A91] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>{tr(lang, 'Заказать', 'Request')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MY PETITIONS REGISTRY (Historical Journal)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-[#F8FAFC] dark:bg-[#0E1B2D] border-b border-[#DCE2EA] dark:border-[#193150] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
            <h3 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#0F1D30] dark:text-[#FFFFFF]">
              {tr(lang, `Журнал поданных заявлений (${requests.length})`, `Submitted Petitions (${requests.length})`)}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#667085]">
            {tr(lang, 'Архив с 2026 г.', 'Archive since 2026')}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#667085] space-y-2">
            <FileText className="w-8 h-8 text-[#667085] mx-auto opacity-50" />
            <p className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
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
          <div className="divide-y divide-[#DCE2EA] dark:divide-[#193150]">
            {requests.map(req => {
              const cfg = statusConfig[req.status] || statusConfig.submitted;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === req.id;
              const isReady = req.status === 'ready';

              return (
                <div key={req.id} className="p-4 sm:p-5 hover:bg-[#F8FAFC]/50 dark:hover:bg-[#162A45]/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-[#667085]">№ {req.id}</span>
                        <h4 className="font-semibold text-sm sm:text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                          {localizeText(req.typeTitle, lang)}
                        </h4>
                      </div>
                      <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans">
                        {tr(lang, 'Подано:', 'Submitted:')} <span className="font-mono">{req.createdAt}</span> •{' '}
                        {tr(lang, 'Срок исполнения: до', 'Expected by:')}{' '}
                        <span className="font-mono font-medium">{req.expectedDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-sans font-semibold border flex items-center space-x-1.5 ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </span>

                      {isReady && (
                        <button
                          onClick={() => onPreviewCert(req)}
                          className="px-3 py-1 rounded-lg bg-[#245A91] hover:bg-[#1C3B65] text-[#FFFFFF] text-xs font-sans font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{tr(lang, 'PDF с ЭЦП', 'Signed PDF')}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="p-1.5 rounded-lg text-[#667085] hover:text-[#0F1D30] hover:bg-[#F8FAFC] dark:hover:bg-[#0E1B2D] transition-colors cursor-pointer"
                        aria-label={tr(lang, 'Подробнее', 'Details')}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Request Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#DCE2EA] dark:border-[#193150] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans animate-fade-in">
                      <div className="space-y-2 bg-[#F8FAFC] dark:bg-[#0E1B2D] p-3.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B]">
                        <span className="font-semibold text-[#142D4E] dark:text-[#245A91] block">
                          {tr(lang, 'Параметры заявления:', 'Request Parameters:')}
                        </span>
                        {req.data && Object.keys(req.data).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(req.data).map(([k, v]) => (
                              <p key={k} className="text-[#475467] dark:text-[#CBD5E1]">
                                <span className="font-medium text-[#667085]">{k}:</span> {String(v)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#667085] italic">
                            {tr(lang, 'Стандартная форма запроса', 'Standard request form')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 bg-[#F8FAFC] dark:bg-[#0E1B2D] p-3.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B] flex flex-col justify-between">
                        <div>
                          <span className="font-semibold text-[#142D4E] dark:text-[#245A91] block">
                            {tr(lang, 'Служебные отметки инспектора:', "Inspector's Remarks:")}
                          </span>
                          <p className="text-[#475467] dark:text-[#CBD5E1] mt-1">
                            {req.history?.[req.history.length - 1]?.comment ||
                              tr(
                                lang,
                                'Заявление принято в работу канцелярией. Проводится верификация данных.',
                                'Petition accepted by the Registry. Data verification in progress.'
                              )}
                          </p>
                        </div>

                        {req.status === 'submitted' && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="text-xs text-[#C63740] hover:underline self-start pt-2 cursor-pointer"
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
          4. ORDER WIZARD MODAL
          ───────────────────────────────────────────────────────────── */}
      {isWizardOpen && selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-5 h-5 text-[#142D4E] dark:text-[#245A91]" />
                <h3 className="font-semibold text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                  {localizeText(selectedType.title, lang)}
                </h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-[#667085] hover:text-[#0F1D30] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans">
              {localizeText(selectedType.description, lang)}{' '}
              {tr(lang, 'Срок оформления:', 'Processing time:')}{' '}
              <strong>
                {tr(lang, `до ${selectedType.slaDays} рабочих дней`, `up to ${selectedType.slaDays} business days`)}
              </strong>.
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs font-sans">
              {selectedType.fields?.map(field => (
                <div key={field.name}>
                  <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1">
                    {field.label} {field.required && <span className="text-[#C63740]">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg p-2.5 text-xs text-[#0F1D30] dark:text-[#FFFFFF]"
                    >
                      <option value="">{tr(lang, 'Выберите вариант...', 'Select an option...')}</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg p-2.5 text-xs text-[#0F1D30] dark:text-[#FFFFFF]"
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg p-2.5 text-xs text-[#0F1D30] dark:text-[#FFFFFF]"
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DCE2EA] dark:border-[#193150]">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#DCE2EA] text-xs font-sans text-[#667085] cursor-pointer"
                >
                  {tr(lang, 'Отмена', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#142D4E] text-[#FFFFFF] text-xs font-sans font-semibold hover:bg-[#0E1F36] flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#245A91]" />
                  <span>
                    {submitting
                      ? tr(lang, 'Отправка...', 'Submitting...')
                      : tr(lang, 'Отправить в деканат', 'Submit Request')}
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
