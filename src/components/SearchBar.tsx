import React, { useState } from 'react';
import { Search } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, startDate, endDate, selectedSkill, selectedGroup });
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <button
        type="submit"
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
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
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
          <option value="グループAA">グループAA</option>
          <option value="グループBA">グループBA</option>
          <option value="グループ3B">グループ3B</option>
        </select>
      </div>
    </form>
  );
};

export default SearchBar;