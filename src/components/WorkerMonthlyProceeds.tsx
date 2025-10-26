import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { generateMonthOptions, formatYearMonth, getPreviousMonth } from '../utils/dateFormat';

interface WorkProceed {
  id: number;
  work_title: string;
  cost: number;
  ended_at: string;
}

interface WorkerMonthlyProceedsProps {
  workerId: number;
}

const WorkerMonthlyProceeds: React.FC<WorkerMonthlyProceedsProps> = ({ workerId }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [proceeds, setProceeds] = useState<WorkProceed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [monthOptions, setMonthOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const startYearMonth = import.meta.env.VITE_START_YEAR_MONTH;
    const options = generateMonthOptions(startYearMonth);
    setMonthOptions(options);
    
    if (options.length > 0) {
      const previousMonth = getPreviousMonth();
      const hasValidPreviousMonth = options.some(option => option.value === previousMonth);
      
      if (hasValidPreviousMonth) {
        setSelectedMonth(previousMonth);
      } else {
        setSelectedMonth(options[0].value);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedMonth && workerId) {
      fetchMonthlyProceeds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, workerId]);

  const fetchMonthlyProceeds = async () => {
    if (!selectedMonth) return;

    try {
      setLoading(true);
      setError('');

      const [year, month] = selectedMonth.split('/');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data, error: fetchError } = await supabase
        .from('works')
        .select(`
          id,
          cost,
          ended_at,
          m_work (
            title
          )
        `)
        .eq('worker_id', workerId)
        .eq('status', 7)
        .gte('ended_at', startDateStr)
        .lte('ended_at', endDateStr)
        .is('deleted_at', null)
        .order('ended_at', { ascending: false });

      if (fetchError) {
        console.error('報酬データ取得エラー:', fetchError);
        setError('報酬データの取得に失敗しました');
        return;
      }

      const formattedProceeds: WorkProceed[] = (data || []).map(work => ({
        id: work.id,
        work_title: work.m_work?.title || '未設定',
        cost: work.cost || 0,
        ended_at: work.ended_at || ''
      }));

      setProceeds(formattedProceeds);

    } catch (err) {
      console.error('報酬データ取得エラー:', err);
      setError('報酬データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = proceeds.reduce((sum, proceed) => sum + proceed.cost, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
        月別報酬
      </h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          対象月を選択
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">選択してください</option>
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      ) : selectedMonth ? (
        <div>
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{selectedMonth}の総報酬</span>
              <span className="text-lg font-bold text-green-600">
                ¥{totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {proceeds.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-3">作業詳細</h4>
              {proceeds.map((proceed) => (
                <div key={proceed.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      #{proceed.id} / {proceed.work_title}
                    </div>
                    <div className="text-xs text-gray-500">
                      完了日: {formatYearMonth(proceed.ended_at)}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ¥{proceed.cost.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {selectedMonth}の完了した作業はありません
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          対象月を選択してください
        </div>
      )}
    </div>
  );
};

export default WorkerMonthlyProceeds;