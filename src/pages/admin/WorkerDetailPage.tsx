import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { WorkerDetail } from '../../types/worker';
import WorkStatusBadge from '../../components/WorkStatusBadge';
import GroupSelector from '../../components/GroupSelector';
import AdminLayout from '../../components/AdminLayout';
import type { Database } from '../../types/database.types';
import { WorkStatus } from '../../constants/workStatus';
import { sortWorkItems } from '../../utils/workSort';
import { getWorkerImageUrl } from '../../utils/image';

// Supabaseの型を拡張
type WorkerWithRelations = Database['public']['Tables']['workers']['Row'] & {
  groups?: {
    name: string | null;
  } | null;
  worker_skills?: Array<{
    id: number;
    rank_id: number | null;
    comment: string | null;
    m_rank?: {
      rank: string | null;
    } | null;
  }>;
  works?: Array<{
    id: number;
    status: number | null;
    quantity: number | null;
    unit_price: number;
    m_work?: {
      title: string;
      default_unit_price: number;
    } | null;
  }>;
};

const WorkerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workerDetail, setWorkerDetail] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedWorker, setEditedWorker] = useState<WorkerDetail | null>(null);
  const [skillOptions, setSkillOptions] = useState<{ id: string; rank: string }[]>([]);

  const unmannedPath = new URL("../../assets/unmanned.png", import.meta.url).href;

  // 認証チェックとデータ取得
  const checkAuthentication = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/admin/login');
        return;
      }
      // 認証確認後、データを取得
      if (id) {
        console.log('URL parameter id:', id, 'parsed:', parseInt(id));
        fetchWorkerDetail(parseInt(id));
      } else {
        console.log('No id parameter found in URL');
      }
    } catch (err) {
      console.error('認証チェックエラー:', err);
      navigate('/admin/login');
    }
  }, [navigate, id]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // m_rankテーブルからスキル選択肢を取得
  useEffect(() => {
    const fetchSkillOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('m_rank')
          .select('id, rank')
          .order('rank');
        
        if (error) {
          console.error('スキルオプション取得エラー:', error);
          return;
        }
        
        setSkillOptions(data || []);
      } catch (err) {
        console.error('スキルオプション取得エラー:', err);
      }
    };

    if (isEditing) {
      fetchSkillOptions();
    }
  }, [isEditing]);

  // 作業者詳細データを取得
  const fetchWorkerDetail = async (workerId: number) => {
    try {
      console.log('Fetching worker detail for ID:', workerId);
      setLoading(true);
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          groups (
            name
          ),
          worker_skills (
            id,
            rank_id,
            comment,
            m_rank (
              rank
            )
          ),
          works (
            id,
            status,
            quantity,
            unit_price,
            m_work (
              title,
              default_unit_price
            )
          )
        `)
        .eq('id', workerId)
        .is('deleted_at', null)
        .single();

      console.log('Supabase query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.log('No worker data found');
        setError('作業者が見つかりませんでした');
        return;
      }

      const worker = data as WorkerWithRelations;
      
      // プロフィール画像のURLを取得
      const imageUrl = await getWorkerImageUrl(worker.image_url || '');
      
      // WorkerDetail型に変換
      const detail: WorkerDetail = {
        id: worker.id,
        name: worker.name || '',
        email: worker.email || '',
        authUserID: worker.auth_user_id,
        birthDate: worker.birthday ? new Date(worker.birthday) : undefined,
        address: worker.address || undefined,
        nextVisitDate: worker.next_visit_date ? new Date(worker.next_visit_date) : undefined,
        unitPriceRatio: worker.unit_price_ratio || undefined,
        groupID: worker.group_id || undefined,
        imageUrl: imageUrl || undefined,
        group: worker.groups ? {
          id: worker.group_id || 0,
          name: worker.groups.name || ''
        } : undefined,
        skills: (worker.worker_skills || []).map(skill => ({
          id: skill.id,
          workerID: worker.id,
          rankID: skill.rank_id || 0,
          rankName: skill.m_rank?.rank || undefined,
          comment: skill.comment || undefined
        })),
        workHistory: (() => {
          // 作業履歴をWork型の配列に変換
          const works = (worker.works || []).map(work => ({
            id: work.id,
            // m_workテーブルから作業名を取得
            title: work.m_work?.title || '作業名未設定',
            status: (work.status || WorkStatus.REQUEST_PLANNED) as WorkStatus,
            quantity: work.quantity || 0,
            // works.unit_priceを使用（0の場合も0で計算）
            unitPrice: work.unit_price
          }));
          
          // ソート処理を適用
          const sortedWorks = sortWorkItems(works);
          
          // ソート済みのWorkをWorkHistoryに変換
          return sortedWorks.map(work => ({
            work,
            assignedAt: new Date(),
            startedAt: work.status === WorkStatus.IN_PROGRESS ? new Date() : undefined,
            completedAt: work.status === WorkStatus.COMPLETED ? new Date() : undefined
          }));
        })()
      };

      setWorkerDetail(detail);
      setEditedWorker(detail);
    } catch (err) {
      console.error('作業者詳細取得エラー:', err);
      setError('作業者詳細の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };



  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedWorker(workerDetail);
  };

  const handleSave = async () => {
    if (!editedWorker) return;

    try {
      setLoading(true);

      // 作業者基本情報を更新
      const { error: workerError } = await supabase
        .from('workers')
        .update({
          name: editedWorker.name,
          email: editedWorker.email,
          birthday: editedWorker.birthDate ? editedWorker.birthDate.toISOString().split('T')[0] : null,
          address: editedWorker.address || null,
          next_visit_date: editedWorker.nextVisitDate ? editedWorker.nextVisitDate.toISOString().split('T')[0] : null,
          unit_price_ratio: editedWorker.unitPriceRatio || null,
          group_id: editedWorker.groupID || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedWorker.id);

      if (workerError) throw workerError;

      // スキル情報を更新
      if (editedWorker.skills.length > 0) {
        const skill = editedWorker.skills[0];
        
        if (skill.id && skill.id > 0) {
          // 既存のスキル情報を更新
          const { error: skillUpdateError } = await supabase
            .from('worker_skills')
            .update({
              rank_id: skill.rankID || null,
              comment: skill.comment || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', skill.id);

          if (skillUpdateError) {
            console.error('スキル情報更新エラー:', skillUpdateError);
          }
        } else if (skill.rankID || skill.comment) {
          // 新しいスキル情報を挿入
          const { error: skillInsertError } = await supabase
            .from('worker_skills')
            .insert([{
              worker_id: editedWorker.id,
              rank_id: skill.rankID || null,
              comment: skill.comment || null
            }]);

          if (skillInsertError) {
            console.error('スキル情報登録エラー:', skillInsertError);
          }
        }
      }
      
      setIsEditing(false);
      alert('変更が保存されました。');
      
      // データを再取得
      if (id) {
        fetchWorkerDetail(parseInt(id));
      }
    } catch (err) {
      console.error('保存エラー:', err);
      alert('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerList = () => {
    navigate('/admin/worker-list');
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (editedWorker) {
      if (field.includes('.')) {
        // Handle nested fields like loginInfo.email
        const [parent, child] = field.split('.');
        setEditedWorker({
          ...editedWorker,
          [parent]: {
            ...(editedWorker as any)[parent],
            [child]: value
          }
        });
      } else {
        setEditedWorker({
          ...editedWorker,
          [field]: value
        });
      }
    }
  };

  const handleGroupChange = (groupName: string, groupId: number | null) => {
    if (editedWorker) {
      setEditedWorker({
        ...editedWorker,
        groupID: groupId || undefined,
        group: groupId ? { id: groupId, name: groupName } : undefined
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout title="作業者詳細">
        <div className="p-8 text-center">
          <p>読み込み中...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !workerDetail || !editedWorker) {
    return (
      <AdminLayout title="作業者詳細">
        <div className="p-8 text-center">
          <p className="text-red-500">{error || '作業者が見つかりませんでした。'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="作業者詳細">

        <div className="bg-white rounded-md shadow-sm p-6">
          <div className="mb-6 flex space-x-2">
            {!isEditing && (
              <button
                onClick={handleWorkerList}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                一覧に戻る
              </button>
            )}
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Edit size={16} />
                <span>編集</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1 px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  <X size={16} />
                  <span>キャンセル</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  <Save size={16} />
                  <span>保存</span>
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Worker Details */}
            <div className="space-y-6">
              {/* 氏名 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">氏名</label>
                <div className="ml-8 flex-1 flex items-center space-x-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedWorker.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <span className="text-lg text-gray-900">{editedWorker.name}</span>
                  )}
                </div>
              </div>

              {/* 生年月日 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">生年月日</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedWorker.birthDate ? editedWorker.birthDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('birthDate', e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedWorker.birthDate ? editedWorker.birthDate.toLocaleDateString('ja-JP') : '-'}</div>
                  )}
                </div>
              </div>

              {/* 住所 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">住所</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedWorker.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedWorker.address}</div>
                  )}
                </div>
              </div>

              {/* 次回来社日 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">次回来社日</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedWorker.nextVisitDate ? editedWorker.nextVisitDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('nextVisitDate', e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedWorker.nextVisitDate ? editedWorker.nextVisitDate.toLocaleDateString('ja-JP') : '-'}</div>
                  )}
                </div>
              </div>

              {/* 単価率 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">単価率</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedWorker.unitPriceRatio ? editedWorker.unitPriceRatio.toFixed(1) : ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 999.9) {
                          handleInputChange('unitPriceRatio', Math.round(value * 10) / 10);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      min="0"
                      max="999.9"
                      step="0.1"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedWorker.unitPriceRatio ? `${editedWorker.unitPriceRatio.toFixed(1)}` : '-'}</div>
                  )}
                </div>
              </div>

              {/* メールアドレス */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">メールアドレス</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedWorker.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedWorker.email || '-'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Group, Skills, and Work History */}
            <div className="space-y-6">
              {/* グループ表示エリア */}
              <div className="border-b border-gray-200 pb-4">
                <div className="w-48 h-48 bg-gray-200 rounded-md flex items-center justify-center mb-4 relative overflow-hidden">
                  {editedWorker.imageUrl ? (
                    <img 
                      src={editedWorker.imageUrl}
                      alt="プロフィール写真"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image load error:', e);
                        e.currentTarget.src = unmannedPath;
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 text-2xl text-gray-400">
                      <img 
                        src={unmannedPath}
                        alt="デフォルトプロフィール写真"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* ランク表示（円） */}
                  <div className="absolute top-2 right-2">
                    {isEditing ? (
                      <select
                        value={editedWorker.skills.length > 0 ? editedWorker.skills[0].rankID?.toString() || '' : ''}
                        onChange={(e) => {
                          const rankId = e.target.value;
                          const selectedSkill = skillOptions.find(s => s.id === rankId);
                          if (editedWorker.skills.length > 0) {
                            const updatedSkills = [...editedWorker.skills];
                            updatedSkills[0] = {
                              ...updatedSkills[0],
                              rankID: rankId ? parseInt(rankId) : 0,
                              rankName: selectedSkill?.rank || undefined
                            };
                            setEditedWorker({
                              ...editedWorker,
                              skills: updatedSkills
                            });
                          } else if (rankId) {
                            setEditedWorker({
                              ...editedWorker,
                              skills: [{
                                id: 0,
                                workerID: editedWorker.id,
                                rankID: parseInt(rankId),
                                rankName: selectedSkill?.rank || undefined,
                                comment: undefined
                              }]
                            });
                          }
                        }}
                        className="w-16 h-8 text-xs border border-gray-300 rounded-full px-2 text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">-</option>
                        {skillOptions.map((skill) => (
                          <option key={skill.id} value={skill.id}>
                            {skill.rank}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {editedWorker.skills.length > 0 && editedWorker.skills[0].rankName ? 
                          editedWorker.skills[0].rankName : '-'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">グループ</label>
                  <div className="ml-4 flex-1">
                    {isEditing ? (
                      <GroupSelector
                        value={editedWorker.group?.name || ''}
                        groupId={editedWorker.groupID}
                        onChange={handleGroupChange}
                        placeholder="グループを選択または入力してください"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{editedWorker.group?.name || '-'}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* スキルコメント */}
              <div className="border-b border-gray-200 pb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">スキルコメント</label>
                <div className="ml-8">
                  {isEditing ? (
                    <textarea
                      value={editedWorker.skills.length > 0 ? editedWorker.skills[0].comment || '' : ''}
                      onChange={(e) => {
                        if (editedWorker.skills.length > 0) {
                          const updatedSkills = [...editedWorker.skills];
                          updatedSkills[0] = {
                            ...updatedSkills[0],
                            comment: e.target.value
                          };
                          setEditedWorker({
                            ...editedWorker,
                            skills: updatedSkills
                          });
                        } else {
                          setEditedWorker({
                            ...editedWorker,
                            skills: [{
                              id: 0,
                              workerID: editedWorker.id,
                              rankID: 0,
                              rankName: undefined,
                              comment: e.target.value
                            }]
                          });
                        }
                      }}
                      rows={4}
                      placeholder="スキルに関するコメントを入力してください"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-600">
                      {editedWorker.skills.length > 0 && editedWorker.skills[0].comment ? (
                        <div>{editedWorker.skills[0].comment}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 作業一覧テーブル */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">作業一覧</h3>
            {editedWorker.workHistory.length > 0 ? (
              <div className="space-y-3">
                {editedWorker.workHistory.map((workHistory, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    {/* 番号 */}
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                      {index + 1}
                    </div>
                    
                    {/* ステータスバッジ */}
                    <div className="flex-shrink-0">
                      <WorkStatusBadge status={workHistory.work.status} />
                    </div>
                    
                    {/* 作業名 */}
                    <div className="flex-1 text-sm text-gray-900">
                      #{workHistory.work.id} / {workHistory.work.title}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">作業なし</div>
            )}
          </div>

        </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </AdminLayout>
  );
};

export default WorkerDetailPage;