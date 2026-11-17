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
      color: 'bg-[#FAF8F3] dark:bg-[#121714] text-[#183D35] dark:text-[#C4A46B] border-[#E3DDD1] dark:border-[#2D3E35]',
      icon: Clock,
    },
    in_review: {
      label: 'На рассмотрении инспектором',
      color: 'bg-[#C4A46B]/15 text-[#183D35] dark:text-[#C4A46B] border-[#C4A46B]/30',
      icon: Clock,
    },
    needs_info: {
      label: 'Требуется уточнение данных',
      color: 'bg-[#A33D35]/10 text-[#A33D35] dark:text-[#E2766E] border-[#A33D35]/30',
      icon: AlertCircle,
    },
    ready: {
      label: 'Подписано ЭЦП (Готово)',
      color: 'bg-[#183D35] text-[#F3EFE5] border-[#C4A46B]/40',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Отклонено деканатом',
      color: 'bg-[#A33D35]/15 text-[#A33D35] dark:text-[#E2766E] border-[#A33D35]/30',
      icon: XCircle,
    },
    cancelled: {
      label: 'Отозвано студентом',
      color: 'bg-[#7E877B]/10 text-[#7E877B] border-[#7E877B]/30',
      icon: XCircle,
    },
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
        <div className="h-96 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ORDER ACTION
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E3DDD1] dark:border-[#26362F]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#183D35] dark:text-[#C4A46B] font-semibold mb-1">
            <span>Канцелярия деканата</span>
            <span>•</span>
            <span>Кабинет 312</span>
            <span>•</span>
            <span>ЭЦП ГОСТ Р 34.10-2012</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
            {lang === 'ru' ? 'Справки и официальные заявления' : 'Official Petitions & Certificates'}
          </h1>
          <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans mt-0.5">
            Заказ справок с усиленной квалифицированной электронной подписью деканата и подача заявлений
          </p>
        </div>

        <button
          onClick={() => handleOpenWizard()}
          className="px-4 py-2 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] font-sans font-semibold text-xs sm:text-sm border border-[#C4A46B]/40 hover:border-[#C4A46B] transition-all flex items-center space-x-2 self-start sm:self-center shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#C4A46B]" />
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
            className="p-4 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs flex flex-col justify-between hover:border-[#183D35] dark:hover:border-[#C4A46B]/60 transition-all space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] flex items-center justify-center">
                  <FileBadge className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
                </div>
                <span className="text-[10px] font-mono text-[#7E877B]">
                  Срок: {t.slaDays} дн.
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5] leading-snug">
                {t.title}
              </h3>
              <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA] font-sans leading-relaxed">
                {t.description}
              </p>
            </div>

            <button
              onClick={() => handleOpenWizard(t)}
              className="w-full py-1.5 px-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#183D35] hover:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans font-medium text-[#183D35] dark:text-[#C4A46B] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
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
      <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-[#FAF8F3] dark:bg-[#121714] border-b border-[#E3DDD1] dark:border-[#26362F] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
            <h3 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#252923] dark:text-[#F3EFE5]">
              Журнал поданных заявлений ({requests.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#7E877B]">
            Архив с 2026 г.
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#7E877B] space-y-2">
            <FileText className="w-8 h-8 text-[#7E877B] mx-auto opacity-50" />
            <p className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5]">
              У вас пока нет активных заявлений
            </p>
            <p>Выберите нужный документ из каталога выше, чтобы оформить заявку.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E3DDD1] dark:divide-[#26362F]">
            {requests.map(req => {
              const cfg = statusConfig[req.status] || statusConfig.submitted;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === req.id;
              const isReady = req.status === 'ready';

              return (
                <div key={req.id} className="p-4 sm:p-5 hover:bg-[#FAF8F3]/50 dark:hover:bg-[#1A2520]/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-[#7E877B]">№ {req.id}</span>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#252923] dark:text-[#F3EFE5]">
                          {req.typeTitle}
                        </h4>
                      </div>
                      <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans">
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
                          className="px-3 py-1 rounded-lg bg-[#C4A46B] hover:bg-[#D9BD8A] text-[#183D35] text-xs font-sans font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>PDF с ЭЦП</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="p-1.5 rounded-lg text-[#7E877B] hover:text-[#252923] hover:bg-[#FAF8F3] dark:hover:bg-[#121714] transition-colors cursor-pointer"
                        aria-label="Подробнее"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Request Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#E3DDD1] dark:border-[#26362F] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans animate-fade-in">
                      <div className="space-y-2 bg-[#FAF8F3] dark:bg-[#121714] p-3.5 rounded-lg border border-[#E3DDD1] dark:border-[#2D3E35]">
                        <span className="font-semibold text-[#183D35] dark:text-[#C4A46B] block">
                          Параметры заявления:
                        </span>
                        {req.data && Object.keys(req.data).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(req.data).map(([k, v]) => (
                              <p key={k} className="text-[#575F53] dark:text-[#C8D1CA]">
                                <span className="font-medium text-[#7E877B]">{k}:</span> {String(v)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#7E877B] italic">Стандартная форма запроса</p>
                        )}
                      </div>

                      <div className="space-y-2 bg-[#FAF8F3] dark:bg-[#121714] p-3.5 rounded-lg border border-[#E3DDD1] dark:border-[#2D3E35] flex flex-col justify-between">
                        <div>
                          <span className="font-semibold text-[#183D35] dark:text-[#C4A46B] block">
                            Служебные отметки инспектора:
                          </span>
                          <p className="text-[#575F53] dark:text-[#C8D1CA] mt-1">
                            {req.history?.[req.history.length - 1]?.comment || 'Заявление принято в работу канцелярией. Проводится верификация данных.'}
                          </p>
                        </div>

                        {req.status === 'submitted' && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="text-xs text-[#A33D35] hover:underline self-start pt-2 cursor-pointer"
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
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-5 h-5 text-[#183D35] dark:text-[#C4A46B]" />
                <h3 className="font-serif font-bold text-base text-[#252923] dark:text-[#F3EFE5]">
                  {selectedType.title}
                </h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-[#7E877B] hover:text-[#252923] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans">
              {selectedType.description} Срок оформления: <strong>до {selectedType.slaDays} рабочих дней</strong>.
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs font-sans">
              {selectedType.fields?.map(field => (
                <div key={field.name}>
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1">
                    {field.label} {field.required && <span className="text-[#A33D35]">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg p-2.5 text-xs text-[#252923] dark:text-[#F3EFE5]"
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
                      className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg p-2.5 text-xs text-[#252923] dark:text-[#F3EFE5]"
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg p-2.5 text-xs text-[#252923] dark:text-[#F3EFE5]"
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E3DDD1] dark:border-[#26362F]">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#E3DDD1] text-xs font-sans text-[#7E877B] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#183D35] text-[#F3EFE5] text-xs font-sans font-semibold hover:bg-[#102923] flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#C4A46B]" />
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
