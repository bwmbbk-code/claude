const TEE_STYLES: Record<string, string> = {
  Championship: 'bg-gray-800 text-yellow-300',
  Black:        'bg-gray-900 text-white',
  Blue:         'bg-blue-600 text-white',
  White:        'bg-white text-gray-700 border border-gray-300',
  Gold:         'bg-yellow-400 text-gray-900',
  Red:          'bg-red-500 text-white',
};

interface Props {
  color: string;
  size?: 'sm' | 'md';
}

export default function TeeBadge({ color, size = 'sm' }: Props) {
  const cls = TEE_STYLES[color] ?? 'bg-gray-200 text-gray-700';
  const pad = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-block rounded font-semibold ${pad} ${cls}`}>
      {color}
    </span>
  );
}
