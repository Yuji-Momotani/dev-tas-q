import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface SearchBarProps {
  onSearch: (searchParams: {
    query: string;
    startDate: string;
    endDate: string;
    selectedSkill: string;
    selectedGroup: string;
  }) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [groupOptions, setGroupOptions] = useState<{ id: number; name: string }[]>([]);

  // m_rankテーブルからrank値とgroupsテーブルからグループ一覧を取得
  useEffect(() => {
    const fetchSkillOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('m_rank')
          .select('rank')
          .order('rank');
        
        if (error) {
          console.error('スキルオプション取得エラー:', error);
          return;
        }
        
        const ranks = data?.map(item => item.rank).filter(Boolean) || [];
        setSkillOptions(ranks);
      } catch (err) {
        console.error('スキルオプション取得エラー:', err);
      }
    };

    const fetchGroupOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('id, name')
          .is('deleted_at', null)
          .order('name');
        
        if (error) {
          console.error('グループオプション取得エラー:', error);
          return;
        }
        
        setGroupOptions(data || []);
      } catch (err) {
        console.error('グループオプション取得エラー:', err);
      }
    };

    fetchSkillOptions();
    fetchGroupOptions();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, startDate, endDate, selectedSkill, selectedGroup });
  };
{/*<form onSubmit={handleSubmit} className="flex space-x-2">
*/}
  return (
    <>
      <button
        onClick={handleSubmit}
        className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
      >
        <Search size={16} className="mr-1" />
        検索
      </button>
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="フリーワード"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm">次回来社日</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span>-</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm">スキル</span>
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全て</option>
          {skillOptions.map((rank) => (
            <option key={rank} value={rank}>
              {rank}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm">グループ</span>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全て</option>
          {groupOptions.map((group) => (
            <option key={group.id} value={group.name || ''}>
              {group.name || '名称未設定'}
            </option>
          ))}
        </select>
      </div>
    </>
  );
  {/*</form>*/}
};

export default SearchBar;