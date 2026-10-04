// the written explanation of a suggested team: { summary, captaincy, nearMisses }
const Explanation = ({ explanation }) => (
  <section className="card p-4 sm:p-5 space-y-3">
    <h2 className="text-lg font-semibold text-gray-800">Why this team</h2>
    <p className="text-gray-700 break-words">{explanation.summary}</p>
    {explanation.captaincy && (
      <p className="text-gray-700 break-words"><span className="font-semibold">Captain and vice-captain: </span>{explanation.captaincy}</p>
    )}
    {explanation.nearMisses.length > 0 && (
      <div>
        <h3 className="font-semibold text-gray-800">Narrowly left out</h3>
        <ul className="mt-1 space-y-1 text-gray-700">
          {explanation.nearMisses.map((entry) => (
            <li key={entry.name} className="break-words"><span className="font-medium">{entry.name}:</span> {entry.reason}</li>
          ))}
        </ul>
      </div>
    )}
    <p className="text-xs text-gray-500">The team is chosen by fixed rules from career figures. This text is written by Gemini and describes the choice; it does not change it.</p>
  </section>
);

export default Explanation;
