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
  Download,
  Send,
  X,
  FileCheck,
  Building,
  ShieldCheck,
  ArrowRight,
  Eye,
  FileBadge,
  Sparkles,
} from 'lucide-react';
import { StudentRequest, RequestType } from '../types';
import { api } from '../services/api';

interface RequestsPageProps {
  onPreviewCert: (req: StudentRequest) => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ onPreviewCert }) => {
  const { user, profile, lang } = useAuth();
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
    loadData();
  }, [user]);

  const handleCancelRequest = async (id: string) => {
    if (!confirm('Вы уверены, что хотите отозвать это заявление?')) return;
    try {
      await api.cancelRequest(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка отмены заявления');
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
      alert(err.message || 'Ошибка отправки заявления');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    submitted: {
      label: 'Подано в деканат',
      color: 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#142D4E] dark:text-[#245A91] border-[#DCE2EA] dark:border-[#1E395B]',
      icon: Clock,
    },
    in_review: {
      label: 'На рассмотрении инспектором',
      color: 'bg-[#245A91]/15 text-[#142D4E] dark:text-[#245A91] border-[#245A91]/30',
      icon: Clock,
    },
    needs_info: {
      label: 'Требуется уточнение данных',
      color: 'bg-[#C63740]/10 text-[#C63740] dark:text-[#F06A73] border-[#C63740]/30',
      icon: AlertCircle,
    },
    ready: {
      label: 'Подписано ЭЦП (Готово)',
      color: 'bg-[#142D4E] text-[#FFFFFF] border-[#245A91]/40',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Отклонено деканатом',
      color: 'bg-[#C63740]/15 text-[#C63740] dark:text-[#F06A73] border-[#C63740]/30',
      icon: XCircle,
    },
    cancelled: {
      label: 'Отозвано студентом',
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
            <span>Канцелярия деканата</span>
            <span>•</span>
            <span>Кабинет 312</span>
            <span>•</span>
            <span>ЭЦП ГОСТ Р 34.10-2012</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
            {lang === 'ru' ? 'Справки и официальные заявления' : 'Official Petitions & Certificates'}
          </h1>
          <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans mt-0.5">
            Заказ справок с усиленной квалифицированной электронной подписью деканата и подача заявлений
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
                  Срок: {t.slaDays} дн.
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-[#0F1D30] dark:text-[#FFFFFF] leading-snug">
                {t.title}
              </h3>
              <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1] font-sans leading-relaxed">
                {t.description}
              </p>
            </div>

            <button
              onClick={() => handleOpenWizard(t)}
              className="w-full py-1.5 px-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#142D4E] hover:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium text-[#142D4E] dark:text-[#245A91] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>Заказать</span>
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
              Журнал поданных заявлений ({requests.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#667085]">
            Архив с 2026 г.
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#667085] space-y-2">
            <FileText className="w-8 h-8 text-[#667085] mx-auto opacity-50" />
            <p className="font-serif font-bold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
              У вас пока нет активных заявлений
            </p>
            <p>Выберите нужный документ из каталога выше, чтобы оформить заявку.</p>
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
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                          {req.typeTitle}
                        </h4>
                      </div>
                      <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans">
                        Подано: <span className="font-mono">{req.createdAt}</span> • Срок исполнения: до <span className="font-mono font-medium">{req.expectedDate}</span>
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
                          className="px-3 py-1 rounded-lg bg-[#245A91] hover:bg-[#D9BD8A] text-[#142D4E] text-xs font-sans font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>PDF с ЭЦП</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="p-1.5 rounded-lg text-[#667085] hover:text-[#0F1D30] hover:bg-[#F8FAFC] dark:hover:bg-[#0E1B2D] transition-colors cursor-pointer"
                        aria-label="Подробнее"
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
                          Параметры заявления:
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
                          <p className="text-[#667085] italic">Стандартная форма запроса</p>
                        )}
                      </div>

                      <div className="space-y-2 bg-[#F8FAFC] dark:bg-[#0E1B2D] p-3.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B] flex flex-col justify-between">
                        <div>
                          <span className="font-semibold text-[#142D4E] dark:text-[#245A91] block">
                            Служебные отметки инспектора:
                          </span>
                          <p className="text-[#475467] dark:text-[#CBD5E1] mt-1">
                            {req.history?.[req.history.length - 1]?.comment || 'Заявление принято в работу канцелярией. Проводится верификация данных.'}
                          </p>
                        </div>

                        {req.status === 'submitted' && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="text-xs text-[#C63740] hover:underline self-start pt-2 cursor-pointer"
                          >
                            Отозвать заявление
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
                <h3 className="font-serif font-bold text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                  {selectedType.title}
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
              {selectedType.description} Срок оформления: <strong>до {selectedType.slaDays} рабочих дней</strong>.
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
                      <option value="">Выберите вариант...</option>
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
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#142D4E] text-[#FFFFFF] text-xs font-sans font-semibold hover:bg-[#0E1F36] flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#245A91]" />
                  <span>{submitting ? 'Отправка...' : 'Отправить в деканат'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
