import { useState } from 'react';

const SIZES = { md: 'w-14 h-14 text-sm', sm: 'w-9 h-9 text-xs' };

// a team's logo, or its short name in a circle when there is none or it does not load
const TeamBadge = ({ team, size = 'md' }) => {
  const [broken, setBroken] = useState(false);
  const frame = `${SIZES[size]} rounded-full border-2 border-gray-200 shrink-0`;

  if (team.logo && !broken) {
    return <img src={team.logo} alt="" className={`${frame} object-cover bg-white`} onError={() => setBroken(true)} referrerPolicy="no-referrer" />;
  }

  return (
    <span className={`${frame} flex items-center justify-center bg-emerald-100 text-emerald-800 font-bold`} aria-hidden="true">
      {team.shortName}
    </span>
  );
};

export default TeamBadge;
