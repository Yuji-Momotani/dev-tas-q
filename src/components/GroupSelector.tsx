import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Database } from '../types/database.types';

type Group = Database['public']['Tables']['groups']['Row'];

interface GroupSelectorProps {
  value?: string; // 選択されたグループ名
  groupId?: number; // 選択されたグループID
  onChange: (groupName: string, groupId: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({
  value = '',
  groupId,
  onChange,
  placeholder = 'グループを選択または入力してください',
  className = '',
  disabled = false,
  required = false
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupInput, setGroupInput] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  // グループ一覧を取得
  useEffect(() => {
    fetchGroups();
  }, []);

  // グループ入力でフィルタリング
  useEffect(() => {
    const filtered = groups.filter(group => 
      group.name?.toLowerCase().includes(groupInput.toLowerCase())
    );
    setFilteredGroups(filtered);
  }, [groupInput, groups]);

  // 外クリック時にドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.group-selector')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  // valueが変更された時にinputを同期
  useEffect(() => {
    setGroupInput(value);
  }, [value]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) {
        console.error('グループ一覧取得エラー:', error);
        return;
      }
      
      setGroups(data || []);
    } catch (err) {
      console.error('グループ一覧取得エラー:', err);
    }
  };

  const handleGroupInputChange = (inputValue: string) => {
    setGroupInput(inputValue);
    // グループ名が変更された場合はIDをクリア
    const existingGroup = groups.find(g => g.name === inputValue);
    onChange(inputValue, existingGroup?.id || null);
    setShowDropdown(true);
  };

  const handleGroupSelect = (group: Group) => {
    setGroupInput(group.name || '');
    onChange(group.name || '', group.id);
    setShowDropdown(false);
  };

  const handleCreateGroup = async () => {
    if (!groupInput.trim()) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([{ name: groupInput.trim() }])
        .select()
        .single();

      if (error) throw error;

      // グループ一覧を再取得
      await fetchGroups();
      
      // 新しく作成したグループを選択
      onChange(groupInput, data.id);
      setShowDropdown(false);
      
      alert('新しいグループが作成されました。');
    } catch (err) {
      console.error('グループ作成エラー:', err);
      alert('グループの作成に失敗しました。');
    }
  };

  const handleDeleteGroup = async (groupIdToDelete: number, groupName: string) => {
    if (!confirm(`グループ「${groupName}」を削除しますか？`)) return;

    try {
      const { error } = await supabase
        .from('groups')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', groupIdToDelete);

      if (error) throw error;

      // グループ一覧を再取得
      await fetchGroups();
      
      // 削除したグループが選択されていた場合はクリア
      if (groupId === groupIdToDelete) {
        onChange('', null);
        setGroupInput('');
      }
      
      alert('グループが削除されました。');
    } catch (err) {
      console.error('グループ削除エラー:', err);
      alert('グループの削除に失敗しました。');
    }
  };

  return (
    <div className={`relative group-selector ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={groupInput}
          onChange={(e) => handleGroupInputChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={placeholder}
          disabled={disabled}
          required={required}
        />
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      {showDropdown && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {/* 新規作成オプション */}
          {groupInput && !filteredGroups.some(g => g.name === groupInput) && (
            <div
              onClick={handleCreateGroup}
              className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-green-600" />
              <span className="text-green-600">「{groupInput}」を新規作成</span>
            </div>
          )}
          
          {/* 既存グループ一覧 */}
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
              >
                <span
                  onClick={() => handleGroupSelect(group)}
                  className="flex-1"
                >
                  {group.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(group.id, group.name || '');
                  }}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="グループを削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : groupInput && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              該当するグループがありません
            </div>
          )}
          
          {!groupInput && groups.length === 0 && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              グループがありません
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupSelector;