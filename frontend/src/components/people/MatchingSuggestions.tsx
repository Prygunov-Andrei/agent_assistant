import React from 'react';
import type { PersonMatch } from '../../types/people';

interface MatchingSuggestionsProps {
  matches: PersonMatch[];
  onSelect: (personId: number) => void;
  className?: string;
}

const MatchingSuggestions: React.FC<MatchingSuggestionsProps> = ({
  matches,
  onSelect,
  className
}) => {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };


  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white shadow-lg rounded-md p-4 mt-2 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Найденные совпадения:</h3>
      <ul>
        {matches.map((match) => (
          <li
            key={match.id}
            className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50"
            onClick={() => onSelect(match.id)}
          >
            <div className="flex items-center">
              {match.photo && (
                <img src={match.photo} alt={match.full_name} className="w-8 h-8 rounded-full mr-3 object-cover" />
              )}
              <div>
                <p className="text-gray-900 font-medium">{match.full_name}</p>
                <p className="text-sm text-gray-500">{match.person_type_display}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${getConfidenceColor(match.confidence)}`}>
                {match.confidence} ({match.score.toFixed(2)})
              </p>
              {match.email && <p className="text-xs text-gray-500">{match.email}</p>}
              {match.phone && <p className="text-xs text-gray-500">{match.phone}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MatchingSuggestions;
