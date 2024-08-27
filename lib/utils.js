import Table from 'cli-table3';

export function formatChoiceOptions(data, filter = '') {
  const keys = Object.keys(data).filter((key) =>
    key.toLowerCase().includes(filter.toLowerCase()),
  );
  const maxLabelLength = Math.max(
    ...keys.map((key) => key.length),
    'Label'.length,
  );

  return keys.map((key) => {
    const label = key.padEnd(maxLabelLength);
    const username = data[key].username;
    const hostname = data[key].hostname;
    return {
      name: `${label} (${username}@${hostname})`,
      value: key,
    };
  });
}

export function generateTable(data) {
  const chars = {
    top: '═',
    'top-mid': '╤',
    'top-left': '╔',
    'top-right': '╗',
    bottom: '═',
    'bottom-mid': '╧',
    'bottom-left': '╚',
    'bottom-right': '╝',
    left: '║',
    'left-mid': '╟',
    mid: '─',
    'mid-mid': '┼',
    right: '║',
    'right-mid': '╢',
    middle: '│',
  };

  const table = new Table({
    head: ['Label', 'Username', 'Hostname'],
    chars: chars,
  });

  Object.keys(data).forEach((key) => {
    table.push([key, data[key].username, data[key].hostname]);
  });

  return table.toString();
}
