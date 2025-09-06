import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationController from '../../components/NotificationController';
import WorkerCreateModal from '../../components/WorkerCreateModal';
import AdminLayout from '../../components/AdminLayout';
import { Download} from 'lucide-react';
import SearchBar from '../../components/SearchBar';
import { supabase } from '../../utils/supabase';
import { WorkStatus } from '../../constants/workStatus';
import { Worker } from '../../types/worker';
import { handleSupabaseError } from '../../utils/auth';

const WorkerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchParams, setSearchParams] = useState({
    query: '',
    startDate: '',
    endDate: '',
    selectedSkill: '',
    selectedGroup: ''
  });
  
  // 作業者作成モーダル関連の状態
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  // 認証チェックとデータ取得
  const checkAuthentication = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/admin/login');
        return;
      }
      // 認証確認後、データを取得
      fetchWorkers();
    } catch (err) {
      console.error('認証チェックエラー:', err);
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // 検索機能の実装
  const handleSearch = (params: { query: string; startDate: string; endDate: string; selectedSkill: string; selectedGroup: string }) => {
    setSearchParams(params);
    
    let filtered = workers;
    
    // フリーワード検索（作業者名、着手中作業）
    if (params.query.trim()) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(worker => 
        (worker.name?.toLowerCase().includes(query) || false) ||
        (worker.inProgressWork?.toLowerCase().includes(query) || false)
      );
    }
    
    // 次回来社日の範囲検索
    if (params.startDate || params.endDate) {
      filtered = filtered.filter(worker => {
        if (!worker.nextVisitDate) return false;
        
        const visitDate = new Date(worker.nextVisitDate);
        const start = params.startDate ? new Date(params.startDate) : null;
        const end = params.endDate ? new Date(params.endDate) : null;
        
        if (start && visitDate < start) return false;
        if (end && visitDate > end) return false;
        
        return true;
      });
    }
    
    // スキル検索
    if (params.selectedSkill) {
      filtered = filtered.filter(worker => worker.skill === params.selectedSkill);
    }
    
    // グループ検索
    if (params.selectedGroup) {
      filtered = filtered.filter(worker => worker.groupName === params.selectedGroup);
    }
    
    setFilteredWorkers(filtered);
    setCheckedItems(new Set());
  };

  // ヘッダーチェックボックスの状態を計算
  const isAllChecked = filteredWorkers.length > 0 && checkedItems.size === filteredWorkers.length;
  const isIndeterminate = checkedItems.size > 0 && checkedItems.size < filteredWorkers.length;

  // 作業者データを取得
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError('');

      // workersテーブルから基本情報を取得し、関連するworks、worker_skills、m_rank、groupsをJOIN
      const { data, error } = await supabase
        .from('workers')
        .select(`
          id,
          name,
          email,
          next_visit_date,
          group_id,
          works!left (
            id,
            status,
            updated_at,
            m_work (
              title,
              unit_price
            )
          ),
          worker_skills!left (
            rank_id,
            m_rank (
              rank
            )
          ),
          groups!left (
            name
          )
        `)
        .is('deleted_at', null)
        .order('name');

      if (error) {
        handleSupabaseError(error, navigate, 'admin', '作業者取得時');
        return;
      }

      // データを変換
      const workerList: Worker[] = (data || []).map(worker => {
        const works = worker.works || [];
        const inProgressWork = works.find(w => w.status === WorkStatus.IN_PROGRESS)?.m_work?.title || null;
        
        // 予定作業は複数ある可能性があるので、スラッシュ区切りで結合
        const plannedWorks = works.filter(w => w.status === WorkStatus.REQUEST_PLANNED).map(w => w.m_work?.title).filter(Boolean);
        const plannedWork = plannedWorks.length > 0 ? plannedWorks.join(' / ') : null;
        
        // 最新の作業日時を取得（完了した作業から）
        const completedWorks = works.filter(w => w.status === WorkStatus.COMPLETED);
        const lastWorkDate = completedWorks.length > 0 
          ? completedWorks.sort((a, b) => new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime())[0].updated_at
          : null;

        // スキル情報を取得
        const skill = worker.worker_skills && worker.worker_skills.length > 0 && worker.worker_skills[0].m_rank 
          ? worker.worker_skills[0].m_rank.rank 
          : null;

        // グループ情報を取得
        const groupName = worker.groups?.name || null;

        return {
          id: worker.id,
          name: worker.name || '',
          email: worker.email || '',
          authUserID: worker.auth_user_id,
          birthDate: worker.birthday ? new Date(worker.birthday) : undefined,
          address: worker.address || undefined,
          nextVisitDate: worker.next_visit_date ? new Date(worker.next_visit_date) : undefined,
          unitPriceRatio: worker.unit_price_ratio || undefined,
          groupID: worker.group_id || undefined,
          lastWorkDate: lastWorkDate ? new Date(lastWorkDate) : undefined,
          inProgressWork,
          plannedWork,
          skill,
          groupName
        };
      });

      setWorkers(workerList);
      setFilteredWorkers(workerList);
    } catch (err) {
      console.error('作業者データ取得エラー:', err);
      setError('作業者データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 日付フォーマット
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '.');
  };

  // ヘッダーチェックボックスのクリック処理
  const handleHeaderCheckboxChange = () => {
    if (checkedItems.size > 0) {
      // 1行でもチェックが入っている場合は全て解除
      setCheckedItems(new Set());
    } else {
      // 全てにチェックを入れる（フィルタされた結果に対して）
      const allIds = new Set(filteredWorkers.map(worker => worker.id.toString()));
      setCheckedItems(allIds);
    }
  };

  // 個別チェックボックスのクリック処理
  const handleRowCheckboxChange = (workerId: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(workerId)) {
      newCheckedItems.delete(workerId);
    } else {
      newCheckedItems.add(workerId);
    }
    setCheckedItems(newCheckedItems);
  };


  const handleAddWorker = () => {
    setShowWorkerModal(true);
  };

  const handleCloseWorkerModal = () => {
    setShowWorkerModal(false);
  };

  const handleWorkerSave = () => {
    // 作業者作成後にデータを再取得
    fetchWorkers();
  };

  // workersが更新されたら検索を再実行
  useEffect(() => {
    if (workers.length > 0) {
      handleSearch(searchParams);
    }
  }, [workers]);
  
  const handleClearCheckedItems = () => {
    setCheckedItems(new Set());
  };

  const handleRemoveWorker = (workerId: string) => {
    const newCheckedItems = new Set(checkedItems);
    newCheckedItems.delete(workerId);
    setCheckedItems(newCheckedItems);
  };


  const handleExportCSV = () => {
    // TODO: Supabaseデータに対応したCSV出力を実装
    console.log('CSV出力機能は実装予定です');
  };

  return (
    <AdminLayout title="作業者一覧">
      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

        <div className="bg-white rounded-md shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-end mb-4">
            <button
              onClick={handleAddWorker}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              作業者作成
            </button>
            <NotificationController 
              checkedItems={checkedItems}
              workers={workers}
              onClearCheckedItems={handleClearCheckedItems}
              onRemoveWorker={handleRemoveWorker}
            />
            
            <SearchBar onSearch={handleSearch} />
            
            <button
              onClick={handleExportCSV}
              className="ml-auto flex items-center space-x-1 px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Download size={16} />
              <span>CSV出力</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">読み込み中...</div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-300">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-700 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        checked={isAllChecked}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleHeaderCheckboxChange}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      作業者名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      着手中作業
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      予定作業
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      次回来社日
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      最終作業日時
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      スキル
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      グループ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/admin/worker-detail/${worker.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={checkedItems.has(worker.id.toString())}
                          onChange={() => handleRowCheckboxChange(worker.id.toString())}
                          className="rounded border-gray-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{worker.id} / {worker.name || '名前未設定'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.inProgressWork || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.plannedWork || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.nextVisitDate ? formatDate(worker.nextVisitDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.lastWorkDate ? formatDate(worker.lastWorkDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.skill || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.groupName || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      

      {/* 作業者作成モーダル */}
      <WorkerCreateModal
        isOpen={showWorkerModal}
        onClose={handleCloseWorkerModal}
        onSave={handleWorkerSave}
      />
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </AdminLayout>
  );
};

export default WorkerListPage;