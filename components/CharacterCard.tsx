import React from 'react';
import { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onSelect: (char: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(character)}
      className={`cursor-pointer group relative bg-white/10 backdrop-blur-sm p-6 rounded-3xl border-4 border-transparent hover:border-yellow-400 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-400/30 flex flex-col items-center text-center`}
    >
      <div className={`w-32 h-32 rounded-full ${character.color} p-1 mb-4 overflow-hidden shadow-inner`}>
        <img src={character.imgUrl} alt={character.name} className="w-full h-full object-cover rounded-full" />
      </div>
      <h3 className="text-2xl font-magic text-yellow-300 mb-2 group-hover:scale-110 transition-transform">{character.name}</h3>
      <p className="text-slate-200 text-sm font-body">{character.description}</p>
    </div>
  );
};