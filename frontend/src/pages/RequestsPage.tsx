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
    submitted: { label: 'Подано в деканат', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
    in_review: { label: 'В обработке', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', icon: Clock },
    needs_info: { label: 'Требуется уточнение', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: AlertCircle },
    ready: { label: 'Готово к выдаче / ЭЦП', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 },
    rejected: { label: 'Отклонено', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', icon: XCircle },
    cancelled: { label: 'Отозвано студентом', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: XCircle },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>{lang === 'ru' ? 'Справки и электронные заявления' : 'Applications & Certificates'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Заказ официальных документов онлайн без очередей в деканате
          </p>
        </div>

        <button
          onClick={() => handleOpenWizard()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ru' ? 'Подать заявление' : 'New Application'}</span>
        </button>
      </div>

      {/* Available Certificate Types Fast Catalog */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
          Популярные документы
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {requestTypes.slice(0, 3).map(type => (
            <div
              key={type.code}
              onClick={() => handleOpenWizard(type)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors block mb-1">
                  {type.title}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {type.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Срок: {type.slaDays} раб. дня</span>
                <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                  Оформить →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student's Requests List */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span>{lang === 'ru' ? 'Мои поданные заявления' : 'My Requests'}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {requests.length}
          </span>
        </h3>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        ) : requests.length === 0 ? (
          /* Empty state - particularly shown for Lina Okafor to demonstrate empty states! */
          <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">
              У вас пока нет поданных заявлений
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Здесь будут отображаться заказанные справки об обучении, заявления на стипендию и общежитие со статусом рассмотрения деканатом.
            </p>
            <button
              onClick={() => handleOpenWizard()}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Заказать первую справку</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const cfg = statusConfig[req.status] || statusConfig.submitted;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === req.id;
              const canCancel = req.status === 'submitted' || req.status === 'in_review';

              return (
                <div
                  key={req.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${cfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          № {req.id}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {req.typeTitle}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Подано: {new Date(req.createdAt).toLocaleDateString('ru-RU')} • Срок готовности: <strong>{req.expectedDate}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {req.status === 'ready' && (
                        <button
                          onClick={() => onPreviewCert(req)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Скачать PDF</span>
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors"
                        >
                          Отозвать
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="История и детали"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Inspector Comment Highlight (if needs_info) */}
                  {req.status === 'needs_info' && (
                    <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Комментарий деканата к заявлению:</p>
                        <p className="mt-0.5">
                          {req.history[req.history.length - 1]?.comment || 'Требуется предоставить дополнительные сведения.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Expanded Timeline & Data View */}
                  {isExpanded && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                      {/* Submitted Fields */}
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                          Параметры заявления:
                        </h4>
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          {Object.entries(req.data).map(([k, v]) => (
                            <div key={k} className="flex justify-between py-0.5">
                              <span className="text-slate-500 capitalize">{k}:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status History Timeline */}
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-2">
                          История обработки деканатом:
                        </h4>
                        <div className="space-y-2 border-l-2 border-blue-500 pl-3 ml-1.5">
                          {req.history.map(h => (
                            <div key={h.id} className="relative">
                              <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {h.status.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(h.createdAt).toLocaleString('ru-RU')}
                                </span>
                                <span className="text-[10px] font-medium text-blue-600">
                                  ({h.authorName})
                                </span>
                              </div>
                              {h.comment && (
                                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                                  {h.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic New Request Wizard Modal */}
      {isWizardOpen && selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Оформление заявления</h3>
                <p className="text-xs text-blue-100">{selectedType.title}</p>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitRequest} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Тип документа
                </label>
                <select
                  value={selectedType.code}
                  onChange={e => {
                    const found = requestTypes.find(t => t.code === e.target.value);
                    if (found) setSelectedType(found);
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {requestTypes.map(t => (
                    <option key={t.code} value={t.code}>
                      {t.title} (Срок: {t.slaDays} дн.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Fields */}
              {selectedType.fields.map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>

                  {f.type === 'select' ? (
                    <select
                      required={f.required}
                      value={formData[f.name] || ''}
                      onChange={e => handleFieldChange(f.name, e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Выберите вариант...</option>
                      {f.options?.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      required={f.required}
                      rows={3}
                      placeholder={f.placeholder}
                      value={formData[f.name] || ''}
                      onChange={e => handleFieldChange(f.name, e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  ) : (
                    <input
                      type={f.type}
                      required={f.required}
                      placeholder={f.placeholder}
                      value={formData[f.name] || ''}
                      onChange={e => handleFieldChange(f.name, e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs">
                Заявление будет зарегистрировано в автоматизированной системе деканата. Уведомление о готовности поступит в ваш личный кабинет.
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
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
